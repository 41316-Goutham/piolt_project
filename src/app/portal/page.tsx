import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function PortalOverviewPage() {
  const session = await auth();
  const projects = await prisma.project.findMany({
    where: { customerId: session!.user.id },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My projects</h1>
        <p className="text-sm text-slate-500 mt-1">
          Live status of your solar installation(s) with SunPower GeneSys.
        </p>
      </div>

      {projects.length === 0 && (
        <p className="text-sm text-slate-500">No projects linked to your account yet.</p>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {projects.map((project) => (
          <div key={project.id} className="border border-slate-200 rounded-xl bg-white p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-semibold text-slate-900">{project.title}</h2>
                <p className="text-sm text-slate-500">
                  {project.siteAddress} &middot; {project.capacityKw} kW &middot; {project.company.name}
                </p>
              </div>
              <StatusBadge status={project.status} />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Progress</span>
                <span>{project.progressPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${project.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Sanctioned amount" value={formatCurrency(project.sanctionedAmount)} />
              <StatCard label="Subsidy amount" value={formatCurrency(project.subsidyAmount)} />
            </div>

            <Link
              href="/portal/timeline"
              className="inline-block mt-4 text-sm text-amber-600 hover:text-amber-700"
            >
              View milestone timeline &rarr;
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
