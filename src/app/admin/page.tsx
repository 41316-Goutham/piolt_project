import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminOverviewPage() {
  const [customerCount, projects, sales, invoices, lowStockItems] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.project.findMany({
      include: { customer: true, company: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sale.findMany(),
    prisma.invoice.findMany(),
    prisma.inventoryItem.findMany({ where: { quantityInStock: { lte: 20 } } }),
  ]);

  const activeProjects = projects.filter((p) =>
    ["SANCTIONED", "IN_PROGRESS", "INSTALLED"].includes(p.status)
  ).length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const pendingInvoiceAmount = invoices
    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + i.amount, 0);

  const recentProjects = projects.slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Snapshot of channel partner operations across all brands.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total customers" value={String(customerCount)} />
        <StatCard label="Active projects" value={String(activeProjects)} hint={`${projects.length} total`} />
        <StatCard label="Total sales revenue" value={formatCurrency(totalRevenue)} />
        <StatCard label="Pending invoice amount" value={formatCurrency(pendingInvoiceAmount)} />
      </div>

      {lowStockItems.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800">
            {lowStockItems.length} item(s) at or below reorder level
          </p>
          <p className="text-xs text-amber-700 mt-1">
            {lowStockItems.map((i) => i.name).join(", ")} &mdash;{" "}
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
              <th className="px-5 py-2 font-medium">Brand</th>
              <th className="px-5 py-2 font-medium">Status</th>
              <th className="px-5 py-2 font-medium">Progress</th>
            </tr>
          </thead>
          <tbody>
            {recentProjects.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 text-slate-800">{p.title}</td>
                <td className="px-5 py-3 text-slate-600">{p.customer.name}</td>
                <td className="px-5 py-3 text-slate-600">{p.company.name}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-5 py-3 text-slate-600">{p.progressPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
