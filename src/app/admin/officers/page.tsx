import { prisma } from "@/lib/prisma";
import { createOfficer } from "./actions";

const DISCOMS = ["APSPDCL", "APEPDCL", "APCPDCL"];

export default async function OfficersPage() {
  const officers = await prisma.officer.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Officer directory</h1>
        <p className="text-sm text-slate-500 mt-1">DISCOM contacts used on approval steps.</p>
      </div>

      <details className="border border-slate-200 rounded-xl bg-white">
        <summary className="cursor-pointer px-5 py-3 font-medium text-slate-800 text-sm">+ New officer</summary>
        <form action={createOfficer} className="p-5 pt-0 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input name="name" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
            <input name="designation" required placeholder="Assistant Engineer (Renewable)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">DISCOM</label>
            <select name="discom" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {DISCOMS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input name="phone" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Circle</label>
            <input name="circle" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Division</label>
            <input name="division" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
            <input name="section" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input name="address" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2">
              Add officer
            </button>
          </div>
        </form>
      </details>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Name</th>
              <th className="px-5 py-2 font-medium">Designation</th>
              <th className="px-5 py-2 font-medium">DISCOM</th>
              <th className="px-5 py-2 font-medium">Circle / Division / Section</th>
              <th className="px-5 py-2 font-medium">Phone</th>
            </tr>
          </thead>
          <tbody>
            {officers.map((o) => (
              <tr key={o.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 text-slate-800">{o.name}</td>
                <td className="px-5 py-3 text-slate-600">{o.designation}</td>
                <td className="px-5 py-3 text-slate-600">{o.discom}</td>
                <td className="px-5 py-3 text-slate-600">{[o.circle, o.division, o.section].filter(Boolean).join(" / ") || "—"}</td>
                <td className="px-5 py-3 text-slate-600">{o.phone ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
