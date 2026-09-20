import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createCustomer } from "./actions";

const DISCOMS = ["APSPDCL", "APEPDCL", "APCPDCL"];
const CATEGORIES = ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "RWA"];

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: { projects: true, user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
        <p className="text-sm text-slate-500 mt-1">{customers.length} customers</p>
      </div>

      <details className="border border-slate-200 rounded-xl bg-white">
        <summary className="cursor-pointer px-5 py-3 font-medium text-slate-800 text-sm">+ New customer</summary>
        <form action={createCustomer} className="p-5 pt-0 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input name="name" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input name="phone" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
            <input name="district" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">DISCOM</label>
            <select name="discom" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">—</option>
              {DISCOMS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select name="category" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2">
              Create customer
            </button>
          </div>
        </form>
      </details>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Name</th>
              <th className="px-5 py-2 font-medium">Phone</th>
              <th className="px-5 py-2 font-medium">District</th>
              <th className="px-5 py-2 font-medium">DISCOM</th>
              <th className="px-5 py-2 font-medium">Projects</th>
              <th className="px-5 py-2 font-medium">Portal login</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link href={`/admin/customers/${c.id}`} className="text-slate-800 hover:text-amber-600 font-medium">
                    {c.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-600">{c.phone}</td>
                <td className="px-5 py-3 text-slate-600">{c.district ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{c.discom ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{c.projects.length}</td>
                <td className="px-5 py-3 text-slate-600">{c.user ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
