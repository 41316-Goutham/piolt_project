import { prisma } from "@/lib/prisma";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

export default async function SalesPage() {
  const sales = await prisma.sale.findMany({
    include: { inventoryItem: { include: { company: true } }, project: { include: { customer: true } } },
    orderBy: { saleDate: "desc" },
  });

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Sales</h1>
        <p className="text-sm text-slate-500 mt-1">
          {sales.length} transactions &middot; Total revenue {formatCurrency(totalRevenue)}
        </p>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Date</th>
              <th className="px-5 py-2 font-medium">Item</th>
              <th className="px-5 py-2 font-medium">Brand</th>
              <th className="px-5 py-2 font-medium">Project / Customer</th>
              <th className="px-5 py-2 font-medium">Qty</th>
              <th className="px-5 py-2 font-medium">Unit price</th>
              <th className="px-5 py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 text-slate-600">{formatDate(sale.saleDate)}</td>
                <td className="px-5 py-3 text-slate-800">{sale.inventoryItem.name}</td>
                <td className="px-5 py-3 text-slate-600">{sale.inventoryItem.company.name}</td>
                <td className="px-5 py-3 text-slate-600">
                  {sale.project ? `${sale.project.title} (${sale.project.customer.name})` : "—"}
                </td>
                <td className="px-5 py-3 text-slate-600">{sale.quantity}</td>
                <td className="px-5 py-3 text-slate-600">{formatCurrency(sale.unitPrice)}</td>
                <td className="px-5 py-3 text-slate-800 font-medium">{formatCurrency(sale.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
