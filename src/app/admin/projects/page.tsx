import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { isApprovalStepOverdue } from "@/lib/overdue";
import Link from "next/link";

const DISCOMS = ["APSPDCL", "APEPDCL", "APCPDCL"];
const STATUSES = ["ACTIVE", "ON_HOLD", "CLOSED", "CANCELLED"];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ discom?: string; status?: string; delayed?: string }>;
}) {
  const { discom, status, delayed } = await searchParams;

  const projects = await prisma.project.findMany({
    where: {
      status: status ? (status as never) : undefined,
      customer: discom ? { discom: discom as never } : undefined,
    },
    include: {
      customer: true,
      stages: { orderBy: { order: "asc" } },
      approvalSteps: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = projects
    .map((p) => {
      const currentStage = p.stages.find((s) => s.status === "IN_PROGRESS" || s.status === "BLOCKED") ?? p.stages[p.stages.length - 1];
      const doneStages = p.stages.filter((s) => s.status === "DONE").length;
      const progressPercent = p.stages.length > 0 ? Math.round((doneStages / p.stages.length) * 100) : 0;
      const isDelayed = p.approvalSteps.some((a) => isApprovalStepOverdue(a));
      return { project: p, currentStage, progressPercent, isDelayed };
    })
    .filter((r) => (delayed === "true" ? r.isDelayed : true));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
        <p className="text-sm text-slate-500 mt-1">{rows.length} of {projects.length} projects</p>
      </div>

      <form method="get" className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">DISCOM</label>
          <select name="discom" defaultValue={discom ?? ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All</option>
            {DISCOMS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select name="status" defaultValue={status ?? ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 pb-2">
          <input type="checkbox" name="delayed" value="true" defaultChecked={delayed === "true"} className="rounded border-slate-300" />
          Delayed only
        </label>
        <button type="submit" className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2">
          Filter
        </button>
      </form>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Project</th>
              <th className="px-5 py-2 font-medium">Customer</th>
              <th className="px-5 py-2 font-medium">DISCOM</th>
              <th className="px-5 py-2 font-medium">Current stage</th>
              <th className="px-5 py-2 font-medium">Progress</th>
              <th className="px-5 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ project, currentStage, progressPercent, isDelayed }) => (
              <tr key={project.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link href={`/admin/projects/${project.id}`} className="text-slate-800 hover:text-amber-600 font-medium">
                    {project.title}
                  </Link>
                  {isDelayed && <span className="ml-2 text-xs font-medium text-red-600">DELAYED</span>}
                </td>
                <td className="px-5 py-3 text-slate-600">{project.customer.name}</td>
                <td className="px-5 py-3 text-slate-600">{project.customer.discom ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{currentStage?.name ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{progressPercent}%</td>
                <td className="px-5 py-3">
                  <StatusBadge status={project.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
