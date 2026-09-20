import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { updateCustomer, provisionPortalLogin } from "../actions";

const DISCOMS = ["APSPDCL", "APEPDCL", "APCPDCL"];
const CATEGORIES = ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "RWA"];

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { user: true, leads: true, projects: true },
  });
  if (!customer) notFound();

  const updateForThisCustomer = updateCustomer.bind(null, customer.id);
  const provisionForThisCustomer = provisionPortalLogin.bind(null, customer.id);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{customer.name}</h1>
        <p className="text-sm text-slate-500 mt-1">{customer.phone}</p>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-4">
        <h2 className="font-medium text-slate-900">Details</h2>
        <form action={updateForThisCustomer} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input name="address" defaultValue={customer.address ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
            <input name="district" defaultValue={customer.district ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">DISCOM</label>
            <select name="discom" defaultValue={customer.discom ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
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
            <select name="category" defaultValue={customer.category ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
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
            <input name="serviceNumber" defaultValue={customer.serviceNumber ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Consumer number</label>
            <input name="consumerNumber" defaultValue={customer.consumerNumber ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sanctioned load (kW)</label>
            <input type="number" step="0.1" name="sanctionedLoadKw" defaultValue={customer.sanctionedLoadKw ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Roof ownership</label>
            <input name="roofOwnership" defaultValue={customer.roofOwnership ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2">
              Save
            </button>
          </div>
        </form>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-3">
        <h2 className="font-medium text-slate-900">Portal access</h2>
        {customer.user ? (
          <p className="text-sm text-slate-600">
            Login provisioned: <span className="font-medium">{customer.user.email}</span>
          </p>
        ) : (
          <form action={provisionForThisCustomer} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" name="email" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Temporary password</label>
              <input name="password" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2">
              Provision login
            </button>
          </form>
        )}
      </div>

      <div className="border border-slate-200 rounded-xl bg-white p-5">
        <h2 className="font-medium text-slate-900 mb-3">Leads</h2>
        {customer.leads.length === 0 && <p className="text-sm text-slate-400">None yet.</p>}
        <ul className="space-y-2">
          {customer.leads.map((l) => (
            <li key={l.id} className="flex items-center justify-between text-sm">
              <Link href={`/admin/leads/${l.id}`} className="text-slate-700 hover:text-amber-600">
                Lead from {new Date(l.createdAt).toLocaleDateString()}
              </Link>
              <StatusBadge status={l.status} />
            </li>
          ))}
        </ul>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white p-5">
        <h2 className="font-medium text-slate-900 mb-3">Projects</h2>
        {customer.projects.length === 0 && <p className="text-sm text-slate-400">None yet.</p>}
        <ul className="space-y-2">
          {customer.projects.map((p) => (
            <li key={p.id} className="flex items-center justify-between text-sm">
              <Link href={`/admin/projects/${p.id}`} className="text-slate-700 hover:text-amber-600">
                {p.title}
              </Link>
              <StatusBadge status={p.status} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
