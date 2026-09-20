import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { createProduct } from "../actions";

const CATEGORIES = ["PANEL", "INVERTER", "BATTERY", "STRUCTURE", "CABLE", "ACCESSORY"];

export default async function ProductsPage() {
  const [products, suppliers] = await Promise.all([
    prisma.product.findMany({ include: { supplier: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
        <p className="text-sm text-slate-500 mt-1">Catalogue of panels, inverters, and BOS components.</p>
      </div>

      <details className="border border-slate-200 rounded-xl bg-white">
        <summary className="cursor-pointer px-5 py-3 font-medium text-slate-800 text-sm">+ New product</summary>
        <form action={createProduct} className="p-5 pt-0 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input name="name" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
            <input name="sku" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select name="category" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
            <input name="unit" defaultValue="pcs" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Default unit price (₹)</label>
            <input type="number" step="0.01" name="unitPriceDefault" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reorder level</label>
            <input type="number" name="reorderLevel" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Spec</label>
            <input name="spec" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="isAlmmCompliant" id="isAlmmCompliant" className="rounded border-slate-300" />
            <label htmlFor="isAlmmCompliant" className="text-sm text-slate-700">
              ALMM compliant
            </label>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2">
              Create product
            </button>
          </div>
        </form>
      </details>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Name</th>
              <th className="px-5 py-2 font-medium">SKU</th>
              <th className="px-5 py-2 font-medium">Category</th>
              <th className="px-5 py-2 font-medium">Supplier</th>
              <th className="px-5 py-2 font-medium">ALMM</th>
              <th className="px-5 py-2 font-medium">Default price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 text-slate-800">{p.name}</td>
                <td className="px-5 py-3 text-slate-500 font-mono text-xs">{p.sku}</td>
                <td className="px-5 py-3 text-slate-600">{p.category.replaceAll("_", " ")}</td>
                <td className="px-5 py-3 text-slate-600">{p.supplier.name}</td>
                <td className="px-5 py-3">
                  {p.isAlmmCompliant ? (
                    <span className="text-emerald-600 text-xs font-medium">Yes</span>
                  ) : (
                    <span className="text-red-600 text-xs font-medium">No</span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-600">{p.unitPriceDefault ? formatCurrency(p.unitPriceDefault) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
