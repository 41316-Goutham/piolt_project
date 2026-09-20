import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canViewFinance } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { getProjectMargin } from "@/lib/margin";
import { formatCurrency } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import Link from "next/link";

export default async function FinancePage() {
  const session = await auth();
  if (!session || !canViewFinance(session.user.role)) {
    redirect("/admin");
  }

  const projects = await prisma.project.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  const margins = await Promise.all(projects.map((p) => getProjectMargin(p.id)));

  const totalContractValue = margins.reduce((sum, m) => sum + m.contractValue, 0);
  const totalInvoiced = margins.reduce((sum, m) => sum + m.invoicedRevenue, 0);
  const totalCost = margins.reduce((sum, m) => sum + m.totalCost, 0);
  const totalActualMargin = margins.reduce((sum, m) => sum + m.actualMargin, 0);

  const invoices = await prisma.clientInvoice.findMany({
    where: { status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
    include: { project: { include: { customer: true } }, payments: true },
    orderBy: { dueDate: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Finance</h1>
        <p className="text-sm text-slate-500 mt-1">Roll-up across all projects.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total contract value" value={formatCurrency(totalContractValue)} />
        <StatCard label="Total invoiced" value={formatCurrency(totalInvoiced)} />
        <StatCard label="Total cost" value={formatCurrency(totalCost)} />
        <StatCard label="Total actual margin" value={formatCurrency(totalActualMargin)} />
      </div>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 font-medium text-slate-900">Outstanding receivables</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Invoice #</th>
              <th className="px-5 py-2 font-medium">Project</th>
              <th className="px-5 py-2 font-medium">Amount</th>
              <th className="px-5 py-2 font-medium">Paid</th>
              <th className="px-5 py-2 font-medium">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
              return (
                <tr key={inv.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 font-mono text-xs text-slate-800">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3 text-slate-600">
                    <Link href={`/admin/projects/${inv.projectId}`} className="hover:text-amber-600">
                      {inv.project.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{formatCurrency(inv.amount)}</td>
                  <td className="px-5 py-3 text-slate-600">{formatCurrency(paid)}</td>
                  <td className="px-5 py-3 text-slate-800 font-medium">{formatCurrency(inv.amount - paid)}</td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-4 text-center text-slate-400">
                  Nothing outstanding.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 font-medium text-slate-900">Margin by project</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Project</th>
              <th className="px-5 py-2 font-medium">Contract value</th>
              <th className="px-5 py-2 font-medium">Total cost</th>
              <th className="px-5 py-2 font-medium">Expected margin</th>
              <th className="px-5 py-2 font-medium">Actual margin</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p, i) => (
              <tr key={p.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3">
                  <Link href={`/admin/projects/${p.id}`} className="text-slate-800 hover:text-amber-600">
                    {p.title}
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-600">{formatCurrency(margins[i].contractValue)}</td>
                <td className="px-5 py-3 text-slate-600">{formatCurrency(margins[i].totalCost)}</td>
                <td className="px-5 py-3 text-slate-600">
                  {formatCurrency(margins[i].expectedMargin)} ({margins[i].expectedMarginPercent.toFixed(1)}%)
                </td>
                <td className="px-5 py-3 text-slate-800 font-medium">
                  {formatCurrency(margins[i].actualMargin)} ({margins[i].actualMarginPercent.toFixed(1)}%)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
