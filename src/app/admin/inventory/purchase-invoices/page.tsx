import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";

export default async function PurchaseInvoicesPage() {
  const invoices = await prisma.purchaseInvoice.findMany({
    include: { supplier: true, lines: true, grns: true },
    orderBy: { invoiceDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Purchase invoices</h1>
          <p className="text-sm text-slate-500 mt-1">Invoices raised by suppliers in the company&apos;s name.</p>
        </div>
        <Link href="/admin/inventory/purchase-invoices/new" className="text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-3 py-2">
          + New purchase invoice
        </Link>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Invoice #</th>
              <th className="px-5 py-2 font-medium">Supplier</th>
              <th className="px-5 py-2 font-medium">Date</th>
              <th className="px-5 py-2 font-medium">Lines</th>
              <th className="px-5 py-2 font-medium">Total</th>
              <th className="px-5 py-2 font-medium">GRNs</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 text-slate-800 font-mono text-xs">{inv.invoiceNumber}</td>
                <td className="px-5 py-3 text-slate-600">{inv.supplier.name}</td>
                <td className="px-5 py-3 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                <td className="px-5 py-3 text-slate-600">{inv.lines.length}</td>
                <td className="px-5 py-3 text-slate-800 font-medium">{formatCurrency(inv.totalAmount)}</td>
                <td className="px-5 py-3 text-slate-600">{inv.grns.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
