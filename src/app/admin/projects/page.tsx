import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      customer: true,
      company: true,
      milestones: { orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Projects &amp; timelines</h1>
        <p className="text-sm text-slate-500 mt-1">{projects.length} projects across all customers</p>
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="border border-slate-200 rounded-xl bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-semibold text-slate-900">{project.title}</h2>
                <p className="text-sm text-slate-500">
                  {project.customer.name} &middot; {project.siteAddress} &middot; {project.capacityKw} kW &middot;{" "}
                  {project.company.name}
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={project.status} />
                <p className="text-sm text-slate-500 mt-2">
                  Sanctioned: <span className="font-medium text-slate-800">{formatCurrency(project.sanctionedAmount)}</span>
                </p>
              </div>
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

            <ol className="space-y-3">
              {project.milestones.map((m) => (
                <li key={m.id} className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${
                      m.status === "COMPLETED"
                        ? "bg-emerald-500"
                        : m.status === "DELAYED"
                        ? "bg-red-500"
                        : m.status === "IN_PROGRESS"
                        ? "bg-amber-500"
                        : "bg-slate-300"
                    }`}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-800">{m.title}</p>
                      {m.description && <p className="text-xs text-slate-400">{m.description}</p>}
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <StatusBadge status={m.status} />
                      <p className="mt-1">
                        {m.completedDate ? formatDate(m.completedDate) : `Planned: ${formatDate(m.plannedDate)}`}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
