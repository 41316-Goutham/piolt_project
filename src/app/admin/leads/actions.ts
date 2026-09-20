"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { LeadStatus } from "@prisma/client";

async function requireSession() {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");
  return session;
}

export async function createLead(formData: FormData) {
  const session = await requireSession();
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const source = (formData.get("source") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  const customer = await prisma.customer.create({ data: { name, phone } });
  await prisma.lead.create({
    data: { customerId: customer.id, source, notes, assignedToId: session.user.id },
  });
  revalidatePath("/admin/leads");
  redirect("/admin/leads");
}

export async function updateLeadStatus(leadId: string, formData: FormData) {
  await requireSession();
  const status = formData.get("status") as LeadStatus;
  const lostReason = (formData.get("lostReason") as string) || null;
  await prisma.lead.update({
    where: { id: leadId },
    data: { status, lostReason: status === "LOST" ? lostReason : null },
  });
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
}

export async function updateLeadCustomer(leadId: string, formData: FormData) {
  await requireSession();
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });

  const district = (formData.get("district") as string) || null;
  const discom = (formData.get("discom") as string) || null;
  const serviceNumber = (formData.get("serviceNumber") as string) || null;
  const consumerNumber = (formData.get("consumerNumber") as string) || null;
  const sanctionedLoadKw = formData.get("sanctionedLoadKw")
    ? parseFloat(formData.get("sanctionedLoadKw") as string)
    : null;
  const category = (formData.get("category") as string) || null;
  const address = (formData.get("address") as string) || null;

  await prisma.customer.update({
    where: { id: lead.customerId },
    data: {
      district,
      discom: discom as never,
      serviceNumber,
      consumerNumber,
      sanctionedLoadKw,
      category: category as never,
      address,
    },
  });
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function convertLeadToProject(leadId: string, formData: FormData) {
  const session = await requireSession();
  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    include: { customer: true },
  });

  const title = formData.get("title") as string;
  const systemSizeKw = parseFloat(formData.get("systemSizeKw") as string);
  const contractValue = parseFloat(formData.get("contractValue") as string);
  const paymentTermsNotes = (formData.get("paymentTermsNotes") as string) || null;

  const discom = lead.customer.discom ?? "APSPDCL";

  const stageTemplate =
    (await prisma.stageTemplate.findFirst({
      where: { discom },
      include: { steps: { orderBy: { order: "asc" } } },
    })) ??
    (await prisma.stageTemplate.findFirst({ include: { steps: { orderBy: { order: "asc" } } } }));

  const approvalTemplate =
    (await prisma.approvalTemplate.findFirst({
      where: { discom },
      include: { steps: { orderBy: { order: "asc" } } },
    })) ??
    (await prisma.approvalTemplate.findFirst({ include: { steps: { orderBy: { order: "asc" } } } }));

  if (!stageTemplate || !approvalTemplate) {
    throw new Error("No stage/approval templates are configured. Set one up under Settings first.");
  }

  const project = await prisma.project.create({
    data: { title, customerId: lead.customerId, systemSizeKw, contractValue, paymentTermsNotes },
  });

  await prisma.projectStage.createMany({
    data: stageTemplate.steps.map((s) => ({
      projectId: project.id,
      stageTemplateStepId: s.id,
      name: s.stepName,
      order: s.order,
      requiresAllocation: s.requiresAllocation,
      ownerId: session.user.id,
    })),
  });

  await prisma.approvalStep.createMany({
    data: approvalTemplate.steps.map((s) => ({
      projectId: project.id,
      approvalTemplateStepId: s.id,
      name: s.stepName,
      order: s.order,
      slaDays: s.slaDays,
    })),
  });

  // PM Surya Ghar: residential systems only.
  const isEligible = lead.customer.category === "RESIDENTIAL" || lead.customer.category == null;
  const slab = await prisma.subsidySlab.findFirst({
    where: {
      isActive: true,
      minKw: { lte: systemSizeKw },
      OR: [{ maxKw: null }, { maxKw: { gte: systemSizeKw } }],
    },
    orderBy: { minKw: "desc" },
  });
  await prisma.subsidy.create({
    data: {
      projectId: project.id,
      isEligible,
      expectedAmount: isEligible ? slab?.amount ?? 0 : 0,
      slabId: slab?.id,
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "WON", convertedAt: new Date(), projectId: project.id },
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${project.id}`);
}
