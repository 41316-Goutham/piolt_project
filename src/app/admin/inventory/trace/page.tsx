import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";

export default async function TracePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim();

  let serialResult: Awaited<ReturnType<typeof findBySerial>> = null;
  let invoiceResult: Awaited<ReturnType<typeof findByInvoice>> = null;

  if (query) {
    serialResult = await findBySerial(query);
    if (!serialResult) invoiceResult = await findByInvoice(query);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Trace</h1>
        <p className="text-sm text-slate-500 mt-1">
          Enter a serial number to see its invoice, project, and customer — or a purchase invoice number to see all its serials.
        </p>
      </div>

      <form method="get" className="flex gap-3">
        <input
          name="q"
          defaultValue={query}
          placeholder="Serial number or invoice number"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2">
          Search
        </button>
      </form>

      {query && !serialResult && !invoiceResult && (
        <p className="text-sm text-slate-500">No serial or invoice found matching &quot;{query}&quot;.</p>
      )}

      {serialResult && (
        <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-3">
          <h2 className="font-medium text-slate-900">
            Serial {serialResult.serialNumber} <StatusBadge status={serialResult.status} />
          </h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Product</dt>
            <dd className="text-slate-800">{serialResult.product.name}</dd>
            <dt className="text-slate-500">Unit cost</dt>
            <dd className="text-slate-800">{formatCurrency(serialResult.unitCost)}</dd>
            <dt className="text-slate-500">Purchase invoice</dt>
            <dd className="text-slate-800">{serialResult.grnLine.purchaseInvoiceLine.purchaseInvoice.invoiceNumber}</dd>
            <dt className="text-slate-500">GRN received</dt>
            <dd className="text-slate-800">{formatDate(serialResult.grnLine.grn.receivedDate)}</dd>
            <dt className="text-slate-500">Project</dt>
            <dd className="text-slate-800">
              {serialResult.project ? (
                <Link href={`/admin/projects/${serialResult.project.id}`} className="text-amber-600 hover:text-amber-700">
                  {serialResult.project.title}
                </Link>
              ) : (
                "Not allocated"
              )}
            </dd>
            <dt className="text-slate-500">Customer</dt>
            <dd className="text-slate-800">{serialResult.project?.customer.name ?? "—"}</dd>
            <dt className="text-slate-500">Installed date</dt>
            <dd className="text-slate-800">{formatDate(serialResult.installedAt)}</dd>
          </dl>
        </div>
      )}

      {invoiceResult && (
        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 font-medium text-slate-900">
            {invoiceResult.invoiceNumber} — {invoiceResult.supplier.name}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="px-5 py-2 font-medium">Serial</th>
                <th className="px-5 py-2 font-medium">Product</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Project</th>
              </tr>
            </thead>
            <tbody>
              {invoiceResult.lines.flatMap((l) =>
                l.grnLines.flatMap((gl) =>
                  gl.stockItems.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3 font-mono text-xs text-slate-800">{s.serialNumber}</td>
                      <td className="px-5 py-3 text-slate-600">{l.product.name}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-600">{s.project?.title ?? "—"}</td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function findBySerial(serialNumber: string) {
  return prisma.stockItem.findUnique({
    where: { serialNumber },
    include: {
      product: true,
      project: { include: { customer: true } },
      grnLine: { include: { grn: true, purchaseInvoiceLine: { include: { purchaseInvoice: true } } } },
    },
  });
}

function findByInvoice(invoiceNumber: string) {
  return prisma.purchaseInvoice.findUnique({
    where: { invoiceNumber },
    include: {
      supplier: true,
      lines: {
        include: {
          product: true,
          grnLines: { include: { stockItems: { include: { project: true } } } },
        },
      },
    },
  });
}
