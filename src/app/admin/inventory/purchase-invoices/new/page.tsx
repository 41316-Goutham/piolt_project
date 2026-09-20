import { prisma } from "@/lib/prisma";
import { createPurchaseInvoice } from "../../actions";

const LINE_COUNT = 6;

export default async function NewPurchaseInvoicePage() {
  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New purchase invoice</h1>
        <p className="text-sm text-slate-500 mt-1">Enter the invoice raised by the supplier in the company&apos;s name.</p>
      </div>

      <form action={createPurchaseInvoice} className="border border-slate-200 rounded-xl bg-white p-5 space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Invoice number</label>
            <input name="invoiceNumber" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
            <select name="supplierId" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Invoice date</label>
            <input type="date" name="invoiceDate" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-slate-700 mb-2">Line items</h2>
          <div className="space-y-3">
            {Array.from({ length: LINE_COUNT }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr] gap-3">
                <select name={`productId_${i}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">—</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input type="number" name={`quantity_${i}`} placeholder="Qty" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input type="number" step="0.01" name={`unitPrice_${i}`} placeholder="Unit price (₹)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2">
          Create invoice
        </button>
      </form>
    </div>
  );
}
