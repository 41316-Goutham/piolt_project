import { prisma } from "@/lib/prisma";
import { updateSubsidySlab, createSubsidySlab } from "./actions";

export default async function SubsidySlabsPage() {
  const slabs = await prisma.subsidySlab.findMany({ orderBy: { minKw: "asc" } });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">PM Surya Ghar subsidy slabs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Editable configuration — verify against pmsuryaghar.gov.in / NREDCAP before relying on this for real claims.
        </p>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-3">
        {slabs.map((slab) => {
          const updateForThisSlab = updateSubsidySlab.bind(null, slab.id);
          return (
            <form key={slab.id} action={updateForThisSlab} className="grid grid-cols-[6rem_6rem_8rem_1fr_5rem_5rem] gap-2 items-center text-sm">
              <input type="number" step="0.1" name="minKw" defaultValue={slab.minKw} placeholder="Min kW" className="rounded-lg border border-slate-300 px-2 py-1.5" />
              <input type="number" step="0.1" name="maxKw" defaultValue={slab.maxKw ?? ""} placeholder="Max kW" className="rounded-lg border border-slate-300 px-2 py-1.5" />
              <input type="number" name="amount" defaultValue={slab.amount} placeholder="Amount (₹)" className="rounded-lg border border-slate-300 px-2 py-1.5" />
              <input name="label" defaultValue={slab.label ?? ""} placeholder="Label" className="rounded-lg border border-slate-300 px-2 py-1.5" />
              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                <input type="checkbox" name="isActive" defaultChecked={slab.isActive} className="rounded border-slate-300" />
                Active
              </label>
              <button type="submit" className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white px-3 py-1.5 text-xs">
                Save
              </button>
            </form>
          );
        })}

        <details className="pt-2">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">+ New slab</summary>
          <form action={createSubsidySlab} className="mt-3 grid grid-cols-[6rem_6rem_8rem_1fr_5rem] gap-2 items-center text-sm">
            <input type="number" step="0.1" name="minKw" placeholder="Min kW" required className="rounded-lg border border-slate-300 px-2 py-1.5" />
            <input type="number" step="0.1" name="maxKw" placeholder="Max kW" className="rounded-lg border border-slate-300 px-2 py-1.5" />
            <input type="number" name="amount" placeholder="Amount (₹)" required className="rounded-lg border border-slate-300 px-2 py-1.5" />
            <input name="label" placeholder="Label" className="rounded-lg border border-slate-300 px-2 py-1.5" />
            <button type="submit" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 text-xs">
              Add
            </button>
          </form>
        </details>
      </div>
    </div>
  );
}
