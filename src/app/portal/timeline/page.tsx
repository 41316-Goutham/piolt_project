import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

export default async function PortalTimelinePage() {
  const session = await auth();
  const projects = await prisma.project.findMany({
    where: { customerId: session!.user.id },
    include: { milestones: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Project timeline</h1>
        <p className="text-sm text-slate-500 mt-1">Milestone-by-milestone progress of your installation.</p>
      </div>

      {projects.map((project) => (
        <div key={project.id} className="border border-slate-200 rounded-xl bg-white p-5">
          <h2 className="font-semibold text-slate-900 mb-4">{project.title}</h2>
          <ol className="relative border-l border-slate-200 ml-2 space-y-6">
            {project.milestones.map((m) => (
              <li key={m.id} className="ml-4">
                <span
                  className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ${
                    m.status === "COMPLETED"
                      ? "bg-emerald-500"
                      : m.status === "DELAYED"
                      ? "bg-red-500"
                      : m.status === "IN_PROGRESS"
                      ? "bg-amber-500"
                      : "bg-slate-300"
                  }`}
                />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{m.title}</p>
                    {m.description && <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {m.completedDate ? `Completed: ${formatDate(m.completedDate)}` : `Planned: ${formatDate(m.plannedDate)}`}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
