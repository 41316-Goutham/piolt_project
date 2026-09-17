import { auth } from "@/auth";
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

export default async function PortalInvoicesPage() {
  const session = await auth();
  const invoices = await prisma.invoice.findMany({
    where: { project: { customerId: session!.user.id } },
    include: { project: true },
    orderBy: { issueDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My invoices</h1>
        <p className="text-sm text-slate-500 mt-1">Invoices raised against your project(s).</p>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Invoice #</th>
              <th className="px-5 py-2 font-medium">Project</th>
              <th className="px-5 py-2 font-medium">Issue date</th>
              <th className="px-5 py-2 font-medium">Due date</th>
              <th className="px-5 py-2 font-medium">Amount</th>
              <th className="px-5 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 text-slate-800 font-mono text-xs">{inv.invoiceNumber}</td>
                <td className="px-5 py-3 text-slate-600">{inv.project.title}</td>
                <td className="px-5 py-3 text-slate-600">{formatDate(inv.issueDate)}</td>
                <td className="px-5 py-3 text-slate-600">{formatDate(inv.dueDate)}</td>
                <td className="px-5 py-3 text-slate-800 font-medium">{formatCurrency(inv.amount)}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
