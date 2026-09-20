import { prisma } from "@/lib/prisma";
import { createGRN } from "../../actions";
import { formatDate } from "@/lib/format";

const SERIALIZED_CATEGORIES = ["PANEL", "INVERTER"];

export default async function NewGRNPage({
  searchParams,
}: {
  searchParams: Promise<{ invoiceId?: string; error?: string }>;
}) {
  const { invoiceId, error } = await searchParams;

  if (!invoiceId) {
    const invoices = await prisma.purchaseInvoice.findMany({
      include: { supplier: true },
      orderBy: { invoiceDate: "desc" },
    });
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">New GRN</h1>
          <p className="text-sm text-slate-500 mt-1">Pick the purchase invoice this delivery is against.</p>
        </div>
        <form method="get" className="border border-slate-200 rounded-xl bg-white p-5 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Purchase invoice</label>
            <select name="invoiceId" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.supplier.name} ({formatDate(inv.invoiceDate)})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2">
            Continue
          </button>
        </form>
      </div>
    );
  }

  const invoice = await prisma.purchaseInvoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { supplier: true, lines: { include: { product: true } } },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New GRN — {invoice.invoiceNumber}</h1>
        <p className="text-sm text-slate-500 mt-1">{invoice.supplier.name}</p>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <form action={createGRN} className="border border-slate-200 rounded-xl bg-white p-5 space-y-6">
        <input type="hidden" name="purchaseInvoiceId" value={invoice.id} />

        {invoice.lines.map((line) => {
          const isSerialized = SERIALIZED_CATEGORIES.includes(line.product.category);
          return (
            <div key={line.id} className="border border-slate-100 rounded-lg p-4 space-y-3">
              <p className="font-medium text-slate-800 text-sm">
                {line.product.name} <span className="text-slate-400 font-normal">(ordered {line.quantity} {line.product.unit})</span>
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Qty received</label>
                  <input type="number" name={`qtyReceived_${line.id}`} defaultValue={line.quantity} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Qty damaged</label>
                  <input type="number" name={`qtyDamaged_${line.id}`} defaultValue={0} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Qty short</label>
                  <input type="number" name={`qtyShort_${line.id}`} defaultValue={0} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
              </div>
              {isSerialized && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Serial numbers (one per line or comma-separated — must match qty received exactly)
                  </label>
                  <textarea
                    name={`serials_${line.id}`}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
                    placeholder={`e.g.\n${line.product.sku}-00001\n${line.product.sku}-00002`}
                  />
                </div>
              )}
            </div>
          );
        })}

        <button type="submit" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2">
          Create GRN
        </button>
      </form>
    </div>
  );
}
