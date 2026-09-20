import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCustomerForUser } from "@/lib/customer";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";

export default async function PortalTimelinePage() {
  const session = await auth();
  const customer = await getCustomerForUser(session!.user.id);

  const projects = await prisma.project.findMany({
    where: { customerId: customer!.id },
    include: { stages: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Project timeline</h1>
        <p className="text-sm text-slate-500 mt-1">Stage-by-stage progress of your installation.</p>
      </div>

      {projects.map((project) => (
        <div key={project.id} className="border border-slate-200 rounded-xl bg-white p-5">
          <h2 className="font-semibold text-slate-900 mb-4">{project.title}</h2>
          <ol className="relative border-l border-slate-200 ml-2 space-y-6">
            {project.stages.map((stage) => (
              <li key={stage.id} className="ml-4">
                <span
                  className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ${
                    stage.status === "DONE"
                      ? "bg-emerald-500"
                      : stage.status === "BLOCKED"
                      ? "bg-red-500"
                      : stage.status === "IN_PROGRESS"
                      ? "bg-amber-500"
                      : "bg-slate-300"
                  }`}
                />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{stage.name}</p>
                    {stage.blockedReason && <p className="text-xs text-red-500 mt-0.5">Blocked: {stage.blockedReason}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {stage.completedDate ? `Completed: ${formatDate(stage.completedDate)}` : `Target: ${formatDate(stage.targetDate)}`}
                    </p>
                  </div>
                  <StatusBadge status={stage.status} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
