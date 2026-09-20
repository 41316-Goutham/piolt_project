import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { notFound } from "next/navigation";
import { updateLeadStatus, updateLeadCustomer, convertLeadToProject } from "../actions";
import Link from "next/link";

const DISCOMS = ["APSPDCL", "APEPDCL", "APCPDCL"];
const CATEGORIES = ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "RWA"];
const STATUSES = ["NEW", "SITE_SURVEY", "QUOTED", "NEGOTIATION", "WON", "LOST"];

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id }, include: { customer: true, project: true } });
  if (!lead) notFound();

  const updateStatusForThisLead = updateLeadStatus.bind(null, lead.id);
  const updateCustomerForThisLead = updateLeadCustomer.bind(null, lead.id);
  const convertForThisLead = convertLeadToProject.bind(null, lead.id);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{lead.customer.name}</h1>
          <p className="text-sm text-slate-500 mt-1">{lead.customer.phone}</p>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      {lead.project && (
        <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 text-sm text-emerald-800">
          Converted to project{" "}
          <Link href={`/admin/projects/${lead.project.id}`} className="underline font-medium">
            {lead.project.title}
          </Link>
        </div>
      )}

      <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-4">
        <h2 className="font-medium text-slate-900">Status</h2>
        <form action={updateStatusForThisLead} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select name="status" defaultValue={lead.status} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Lost reason (if Lost)</label>
            <input name="lostReason" defaultValue={lead.lostReason ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2">
            Update
          </button>
        </form>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-4">
        <h2 className="font-medium text-slate-900">Customer &amp; site details</h2>
        <p className="text-xs text-slate-400">These fill in progressively as the lead advances (e.g. after site survey).</p>
        <form action={updateCustomerForThisLead} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input name="address" defaultValue={lead.customer.address ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
            <input name="district" defaultValue={lead.customer.district ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">DISCOM</label>
            <select name="discom" defaultValue={lead.customer.discom ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
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
            <select name="category" defaultValue={lead.customer.category ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Service number</label>
            <input name="serviceNumber" defaultValue={lead.customer.serviceNumber ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Consumer number</label>
            <input name="consumerNumber" defaultValue={lead.customer.consumerNumber ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sanctioned load (kW)</label>
            <input type="number" step="0.1" name="sanctionedLoadKw" defaultValue={lead.customer.sanctionedLoadKw ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2">
              Save details
            </button>
          </div>
        </form>
      </div>

      {!lead.project && lead.status !== "LOST" && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-5 space-y-4">
          <h2 className="font-medium text-amber-900">Convert to project</h2>
          <p className="text-xs text-amber-700">
            Marks the lead Won and creates a project with the default APSPDCL stage &amp; approval checklist.
          </p>
          <form action={convertForThisLead} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Project title</label>
              <input name="title" required defaultValue={`Rooftop Solar — ${lead.customer.name}`} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">System size (kW)</label>
              <input type="number" step="0.1" name="systemSizeKw" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contract value (₹)</label>
              <input type="number" step="1" name="contractValue" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment terms</label>
              <input name="paymentTermsNotes" placeholder="e.g. 50% advance, 50% on commissioning" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2">
                Convert to project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
