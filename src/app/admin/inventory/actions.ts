"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canMutateStock } from "@/lib/roles";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const SERIALIZED_CATEGORIES = ["PANEL", "INVERTER"];
const MAX_INVOICE_LINES = 6;

async function requireStockMutator() {
  const session = await auth();
  if (!session || !canMutateStock(session.user.role)) {
    throw new Error("You do not have permission to modify stock.");
  }
  return session;
}

async function requireSession() {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");
  return session;
}

export async function createProduct(formData: FormData) {
  await requireStockMutator();
  await prisma.product.create({
    data: {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      category: formData.get("category") as never,
      supplierId: formData.get("supplierId") as string,
      spec: (formData.get("spec") as string) || null,
      unit: (formData.get("unit") as string) || "pcs",
      unitPriceDefault: formData.get("unitPriceDefault") ? parseFloat(formData.get("unitPriceDefault") as string) : null,
      isAlmmCompliant: formData.get("isAlmmCompliant") === "on",
      reorderLevel: formData.get("reorderLevel") ? parseInt(formData.get("reorderLevel") as string, 10) : null,
    },
  });
  revalidatePath("/admin/inventory/products");
  redirect("/admin/inventory/products");
}

export async function createPurchaseInvoice(formData: FormData) {
  await requireStockMutator();
  const invoiceNumber = formData.get("invoiceNumber") as string;
  const supplierId = formData.get("supplierId") as string;
  const invoiceDate = new Date(formData.get("invoiceDate") as string);

  const lines: { productId: string; quantity: number; unitPrice: number; lineTotal: number }[] = [];
  for (let i = 0; i < MAX_INVOICE_LINES; i++) {
    const productId = formData.get(`productId_${i}`) as string | null;
    const quantity = formData.get(`quantity_${i}`) as string | null;
    const unitPrice = formData.get(`unitPrice_${i}`) as string | null;
    if (!productId || !quantity || !unitPrice) continue;
    const qty = parseInt(quantity, 10);
    const price = parseFloat(unitPrice);
    lines.push({ productId, quantity: qty, unitPrice: price, lineTotal: qty * price });
  }
  if (lines.length === 0) throw new Error("Add at least one line item.");
  const totalAmount = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  await prisma.purchaseInvoice.create({
    data: { invoiceNumber, supplierId, invoiceDate, totalAmount, lines: { create: lines } },
  });
  revalidatePath("/admin/inventory/purchase-invoices");
  redirect("/admin/inventory/purchase-invoices");
}

export async function createGRN(formData: FormData) {
  const session = await requireStockMutator();
  const purchaseInvoiceId = formData.get("purchaseInvoiceId") as string;
  const notes = (formData.get("notes") as string) || null;

  const invoice = await prisma.purchaseInvoice.findUniqueOrThrow({
    where: { id: purchaseInvoiceId },
    include: { lines: { include: { product: true } } },
  });

  try {
    await prisma.$transaction(async (tx) => {
      const grn = await tx.gRN.create({
        data: { purchaseInvoiceId, receivedById: session.user.id, notes },
      });

      for (const line of invoice.lines) {
        const qtyReceived = parseInt((formData.get(`qtyReceived_${line.id}`) as string) || "0", 10);
        const qtyDamaged = parseInt((formData.get(`qtyDamaged_${line.id}`) as string) || "0", 10);
        const qtyShort = parseInt((formData.get(`qtyShort_${line.id}`) as string) || "0", 10);
        if (qtyReceived === 0 && qtyDamaged === 0 && qtyShort === 0) continue;

        const grnLine = await tx.gRNLine.create({
          data: { grnId: grn.id, purchaseInvoiceLineId: line.id, productId: line.productId, qtyReceived, qtyDamaged, qtyShort },
        });

        const isSerialized = SERIALIZED_CATEGORIES.includes(line.product.category);

        if (isSerialized && qtyReceived > 0) {
          const rawSerials = (formData.get(`serials_${line.id}`) as string) || "";
          const serials = Array.from(new Set(rawSerials.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)));

          if (serials.length !== qtyReceived) {
            throw new Error(
              `${line.product.name}: entered ${serials.length} serial number(s) but quantity received is ${qtyReceived}. They must match exactly.`
            );
          }

          const existing = await tx.stockItem.findMany({
            where: { serialNumber: { in: serials } },
            select: { serialNumber: true },
          });
          if (existing.length > 0) {
            throw new Error(
              `${line.product.name}: duplicate serial number(s) already exist in the system: ${existing
                .map((e) => e.serialNumber)
                .join(", ")}`
            );
          }

          await tx.stockItem.createMany({
            data: serials.map((serialNumber) => ({
              serialNumber,
              productId: line.productId,
              grnLineId: grnLine.id,
              unitCost: line.unitPrice,
              status: "IN_STOCK" as const,
            })),
          });
        } else if (!isSerialized && qtyReceived > 0) {
          await tx.product.update({
            where: { id: line.productId },
            data: { quantityInStock: { increment: qtyReceived } },
          });
        }
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create GRN.";
    redirect(`/admin/inventory/grn/new?invoiceId=${purchaseInvoiceId}&error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/inventory");
  redirect("/admin/inventory");
}

export async function allocateStock(formData: FormData) {
  await requireStockMutator();
  const projectId = formData.get("projectId") as string;
  const stockItemIds = formData.getAll("stockItemIds") as string[];
  if (stockItemIds.length === 0) throw new Error("Select at least one serial to allocate.");

  await prisma.stockItem.updateMany({
    where: { id: { in: stockItemIds }, status: "IN_STOCK" },
    data: { status: "RESERVED", projectId, reservedAt: new Date() },
  });
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function issueStock(formData: FormData) {
  const session = await requireStockMutator();
  const projectId = formData.get("projectId") as string;
  const stockItemIds = formData.getAll("stockItemIds") as string[];
  if (stockItemIds.length === 0) throw new Error("Select at least one serial to issue.");

  await prisma.stockItem.updateMany({
    where: { id: { in: stockItemIds }, status: "RESERVED" },
    data: { status: "ISSUED", issuedAt: new Date(), issuedById: session.user.id },
  });
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/projects/${projectId}`);
}

// PRD: the site supervisor (not just inventory managers) confirms installed serials.
export async function confirmInstalled(formData: FormData) {
  const session = await requireSession();
  if (!["ADMIN", "INVENTORY_MANAGER", "SITE_SUPERVISOR"].includes(session.user.role)) {
    throw new Error("You do not have permission to confirm installation.");
  }
  const projectId = formData.get("projectId") as string;
  const stockItemIds = formData.getAll("stockItemIds") as string[];
  if (stockItemIds.length === 0) throw new Error("Select at least one serial to confirm.");

  await prisma.stockItem.updateMany({
    where: { id: { in: stockItemIds }, status: "ISSUED" },
    data: { status: "INSTALLED", installedAt: new Date(), installedConfirmedById: session.user.id },
  });
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function recordConsumption(formData: FormData) {
  const session = await requireStockMutator();
  const productId = formData.get("productId") as string;
  const projectId = (formData.get("projectId") as string) || null;
  const quantity = parseInt(formData.get("quantity") as string, 10);

  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  if (product.quantityInStock < quantity) {
    throw new Error(`Not enough stock: ${product.quantityInStock} ${product.unit} available.`);
  }

  await prisma.$transaction([
    prisma.product.update({ where: { id: productId }, data: { quantityInStock: { decrement: quantity } } }),
    prisma.stockConsumption.create({
      data: { productId, projectId, quantity, unitCost: product.unitPriceDefault ?? 0, recordedById: session.user.id },
    }),
  ]);
  revalidatePath("/admin/inventory");
  if (projectId) revalidatePath(`/admin/projects/${projectId}`);
}
