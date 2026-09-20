import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { canViewFinance } from "@/lib/roles";
import { isApprovalStepOverdue } from "@/lib/overdue";
import { getProjectMargins } from "@/lib/margin";
import Link from "next/link";

export default async function AdminOverviewPage() {
  const session = await auth();
  const financeVisible = session ? canViewFinance(session.user.role) : false;

  const [customerCount, projects, products] = await Promise.all([
    prisma.customer.count(),
    prisma.project.findMany({
      include: { customer: true, stages: { orderBy: { order: "asc" } }, approvalSteps: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({ include: { stockItems: { select: { status: true } } } }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const p of projects) {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
  }

  const delayedProjects = projects.filter((p) => p.approvalSteps.some((a) => isApprovalStepOverdue(a)));

  const lowStockProducts = products.filter((p) => {
    const isSerialized = p.category === "PANEL" || p.category === "INVERTER";
    const inStock = isSerialized ? p.stockItems.filter((s) => s.status === "IN_STOCK").length : p.quantityInStock;
    return p.reorderLevel != null && inStock <= p.reorderLevel;
  });

  let receivablesDue = 0;
  let totalActualMargin = 0;
  if (financeVisible) {
    const invoices = await prisma.clientInvoice.findMany({
      where: { status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
      include: { payments: true },
    });
    receivablesDue = invoices.reduce((sum, inv) => sum + (inv.amount - inv.payments.reduce((s, p) => s + p.amount, 0)), 0);

    const margins = await getProjectMargins(projects.map((p) => p.id));
    totalActualMargin = [...margins.values()].reduce((sum, m) => sum + m.actualMargin, 0);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Snapshot of operations across all projects.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Customers" value={String(customerCount)} />
        <StatCard label="Active projects" value={String(statusCounts.ACTIVE ?? 0)} hint={`${projects.length} total`} />
        <StatCard label="Delayed projects" value={String(delayedProjects.length)} hint="At least one overdue approval step" />
        {financeVisible ? (
          <StatCard label="Receivables due" value={formatCurrency(receivablesDue)} />
        ) : (
          <StatCard label="Low-stock items" value={String(lowStockProducts.length)} />
        )}
      </div>

      {financeVisible && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total actual margin" value={formatCurrency(totalActualMargin)} />
          <StatCard label="Low-stock items" value={String(lowStockProducts.length)} />
        </div>
      )}

      {delayedProjects.length > 0 && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4">
          <p className="text-sm font-medium text-red-800 mb-2">Delayed projects (overdue DISCOM approval step)</p>
          <ul className="text-sm text-red-700 space-y-1">
            {delayedProjects.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/projects/${p.id}`} className="underline">
                  {p.title}
                </Link>{" "}
                — {p.customer.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800">
            {lowStockProducts.length} item(s) at or below reorder level —{" "}
            <Link href="/admin/inventory" className="underline">
              view inventory
            </Link>
          </p>
        </div>
      )}

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-medium text-slate-900">Recent projects</h2>
          <Link href="/admin/projects" className="text-sm text-amber-600 hover:text-amber-700">
            View all
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Project</th>
              <th className="px-5 py-2 font-medium">Customer</th>
              <th className="px-5 py-2 font-medium">Current stage</th>
              <th className="px-5 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.slice(0, 6).map((p) => {
              const currentStage = p.stages.find((s) => s.status === "IN_PROGRESS" || s.status === "BLOCKED") ?? p.stages[p.stages.length - 1];
              return (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3">
                    <Link href={`/admin/projects/${p.id}`} className="text-slate-800 hover:text-amber-600 font-medium">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.customer.name}</td>
                  <td className="px-5 py-3 text-slate-600">{currentStage?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
