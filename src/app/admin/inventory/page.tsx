import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canMutateStock } from "@/lib/roles";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";

export default async function InventoryPage() {
  const session = await auth();
  const canMutate = session ? canMutateStock(session.user.role) : false;

  const products = await prisma.product.findMany({
    include: {
      supplier: true,
      stockItems: { select: { status: true, unitCost: true } },
    },
    orderBy: { name: "asc" },
  });

  let totalStockValue = 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">Stock on hand across all brands.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/inventory/products" className="text-sm rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50">
            Products
          </Link>
          <Link href="/admin/inventory/purchase-invoices" className="text-sm rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50">
            Purchase invoices
          </Link>
          <Link href="/admin/inventory/trace" className="text-sm rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50">
            Trace serial
          </Link>
          {canMutate && (
            <Link href="/admin/inventory/grn/new" className="text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-3 py-2">
              + New GRN
            </Link>
          )}
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Product</th>
              <th className="px-5 py-2 font-medium">Brand</th>
              <th className="px-5 py-2 font-medium">Category</th>
              <th className="px-5 py-2 font-medium">In stock</th>
              <th className="px-5 py-2 font-medium">Reserved</th>
              <th className="px-5 py-2 font-medium">Issued</th>
              <th className="px-5 py-2 font-medium">Installed</th>
              <th className="px-5 py-2 font-medium">ALMM</th>
              <th className="px-5 py-2 font-medium">Value on hand</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isSerialized = p.category === "PANEL" || p.category === "INVERTER";
              const counts = { IN_STOCK: 0, RESERVED: 0, ISSUED: 0, INSTALLED: 0 };
              let value = 0;
              for (const s of p.stockItems) {
                if (s.status in counts) counts[s.status as keyof typeof counts]++;
                if (s.status === "IN_STOCK") value += s.unitCost;
              }
              const inStock = isSerialized ? counts.IN_STOCK : p.quantityInStock;
              if (isSerialized) {
                totalStockValue += value;
              } else {
                value = p.quantityInStock * (p.unitPriceDefault ?? 0);
                totalStockValue += value;
              }
              const lowStock = p.reorderLevel != null && inStock <= p.reorderLevel;

              return (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 text-slate-800">{p.name}</td>
                  <td className="px-5 py-3 text-slate-600">{p.supplier.name}</td>
                  <td className="px-5 py-3 text-slate-600">{p.category.replaceAll("_", " ")}</td>
                  <td className="px-5 py-3">
                    <span className={lowStock ? "text-red-600 font-medium" : "text-slate-700"}>
                      {inStock} {p.unit}
                    </span>
                    {lowStock && <span className="ml-2 text-xs text-red-500">low stock</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{isSerialized ? counts.RESERVED : "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{isSerialized ? counts.ISSUED : "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{isSerialized ? counts.INSTALLED : "—"}</td>
                  <td className="px-5 py-3">
                    {p.isAlmmCompliant ? (
                      <span className="text-emerald-600 text-xs font-medium">Yes</span>
                    ) : (
                      <span className="text-red-600 text-xs font-medium">No</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{formatCurrency(value)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-500">Total stock value on hand: {formatCurrency(totalStockValue)}</p>
    </div>
  );
}
