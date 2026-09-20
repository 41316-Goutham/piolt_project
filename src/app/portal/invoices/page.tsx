import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCustomerForUser } from "@/lib/customer";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function PortalInvoicesPage() {
  const session = await auth();
  const customer = await getCustomerForUser(session!.user.id);

  const invoices = await prisma.clientInvoice.findMany({
    where: { project: { customerId: customer!.id } },
    include: { project: true, payments: true },
    orderBy: { issueDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My invoices</h1>
        <p className="text-sm text-slate-500 mt-1">Invoices and payments recorded against your project(s).</p>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Invoice #</th>
              <th className="px-5 py-2 font-medium">Project</th>
              <th className="px-5 py-2 font-medium">Milestone</th>
              <th className="px-5 py-2 font-medium">Amount</th>
              <th className="px-5 py-2 font-medium">Paid</th>
              <th className="px-5 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
              return (
                <tr key={inv.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 text-slate-800 font-mono text-xs">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3 text-slate-600">{inv.project.title}</td>
                  <td className="px-5 py-3 text-slate-600">{inv.milestoneType.replaceAll("_", " ")}</td>
                  <td className="px-5 py-3 text-slate-800 font-medium">{formatCurrency(inv.amount)}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {formatCurrency(paid)}
                    {inv.payments[0] && <span className="text-xs text-slate-400"> ({formatDate(inv.payments[0].date)})</span>}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={inv.status} />
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
