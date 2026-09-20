import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCustomerForUser } from "@/lib/customer";
import { StatCard } from "@/components/StatCard";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function PortalSubsidyPage() {
  const session = await auth();
  const customer = await getCustomerForUser(session!.user.id);

  const projects = await prisma.project.findMany({
    where: { customerId: customer!.id },
    include: { subsidy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Subsidy</h1>
        <p className="text-sm text-slate-500 mt-1">PM Surya Ghar central subsidy status for your project(s).</p>
      </div>

      {projects.map((project) => (
        <div key={project.id} className="border border-slate-200 rounded-xl bg-white p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">{project.title}</h2>

          {!project.subsidy || !project.subsidy.isEligible ? (
            <p className="text-sm text-slate-500">Not eligible for the PM Surya Ghar central subsidy.</p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <StatCard label="Expected amount" value={formatCurrency(project.subsidy.expectedAmount)} />
                <StatCard label="Paid to" value={project.subsidy.isDbtToCustomer ? "Your bank account (DBT)" : "SunPower GeneSys"} />
              </div>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-slate-500">Reference number</dt>
                <dd className="text-slate-800">{project.subsidy.referenceNumber ?? "Not yet claimed"}</dd>
                <dt className="text-slate-500">Claim date</dt>
                <dd className="text-slate-800">{formatDate(project.subsidy.claimDate)}</dd>
                <dt className="text-slate-500">Received date</dt>
                <dd className="text-slate-800">{formatDate(project.subsidy.receivedDate)}</dd>
              </dl>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
