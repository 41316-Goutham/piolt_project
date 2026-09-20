import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCustomerForUser } from "@/lib/customer";
import { getProjectMargin } from "@/lib/margin";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";

export default async function PortalOverviewPage() {
  const session = await auth();
  const customer = await getCustomerForUser(session!.user.id);

  const projects = await prisma.project.findMany({
    where: { customerId: customer!.id },
    include: { stages: { orderBy: { order: "asc" } }, subsidy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My projects</h1>
        <p className="text-sm text-slate-500 mt-1">Live status of your solar installation(s) with SunPower GeneSys.</p>
      </div>

      {projects.length === 0 && <p className="text-sm text-slate-500">No projects linked to your account yet.</p>}

      <div className="grid md:grid-cols-2 gap-5">
        {await Promise.all(
          projects.map(async (project) => {
            const doneStages = project.stages.filter((s) => s.status === "DONE").length;
            const progressPercent = project.stages.length > 0 ? Math.round((doneStages / project.stages.length) * 100) : 0;
            const currentStage = project.stages.find((s) => s.status === "IN_PROGRESS" || s.status === "BLOCKED") ?? project.stages[project.stages.length - 1];
            const margin = await getProjectMargin(project.id);

            return (
              <div key={project.id} className="border border-slate-200 rounded-xl bg-white p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">{project.title}</h2>
                    <p className="text-sm text-slate-500">
                      {project.systemSizeKw} kW &middot; {currentStage?.name ?? "—"}
                    </p>
                  </div>
                  <StatusBadge status={currentStage?.status ?? project.status} />
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Contract value" value={formatCurrency(margin.contractValue)} />
                  <StatCard
                    label="Subsidy"
                    value={project.subsidy?.isEligible ? formatCurrency(project.subsidy.expectedAmount) : "Not eligible"}
                  />
                </div>

                <Link href="/portal/timeline" className="inline-block mt-4 text-sm text-amber-600 hover:text-amber-700">
                  View milestone timeline &rarr;
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
