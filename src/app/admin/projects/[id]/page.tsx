import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { formatCurrency, formatDate } from "@/lib/format";
import { canViewFinance, canViewSubsidyDetails, canMutateStock } from "@/lib/roles";
import { getProjectMargin } from "@/lib/margin";
import { getProjectWarnings } from "@/lib/rules";
import { isApprovalStepOverdue } from "@/lib/overdue";
import {
  updateProjectStage,
  updateApprovalStep,
  upsertDocumentItem,
  updateSubsidy,
  addCostEntry,
  addClientInvoice,
  addPayment,
} from "./actions";
import { allocateStock, issueStock, confirmInstalled } from "../../inventory/actions";

const STAGE_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "DONE"];
const APPROVAL_STATUSES = ["NOT_STARTED", "SUBMITTED", "QUERY_RAISED", "APPROVED", "REJECTED"];
const DOCUMENT_STATUSES = ["PENDING", "RECEIVED", "SUBMITTED", "REJECTED", "ACCEPTED"];
const COST_CATEGORIES = ["LABOUR", "TRANSPORT", "LIAISON", "MATERIAL_OTHER", "OTHER"];
const MILESTONE_TYPES = ["ADVANCE", "ON_DELIVERY", "ON_COMMISSIONING", "BALANCE", "OTHER"];
const INVOICE_STATUSES = ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"];
const PAYMENT_MODES = ["CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "OTHER"];

function toDateInput(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) notFound();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      stages: { orderBy: { order: "asc" } },
      approvalSteps: { orderBy: { order: "asc" }, include: { officer: true, approvalTemplateStep: true } },
      documents: true,
      subsidy: true,
      costEntries: { orderBy: { date: "desc" } },
      clientInvoices: { include: { payments: true }, orderBy: { issueDate: "desc" } },
      stockItems: { include: { product: true } },
    },
  });
  if (!project) notFound();

  const [officers, availableStock, margin, warnings] = await Promise.all([
    prisma.officer.findMany({ orderBy: { name: "asc" } }),
    prisma.stockItem.findMany({ where: { status: "IN_STOCK" }, include: { product: true }, orderBy: { serialNumber: "asc" } }),
    getProjectMargin(project.id),
    getProjectWarnings(project.id),
  ]);

  const role = session.user.role;
  const financeVisible = canViewFinance(role);
  const subsidyVisible = canViewSubsidyDetails(role);
  const stockMutator = canMutateStock(role);
  const canConfirmInstalled = (["ADMIN", "INVENTORY_MANAGER", "SITE_SUPERVISOR"] as string[]).includes(role);

  const doneStages = project.stages.filter((s) => s.status === "DONE").length;
  const progressPercent = project.stages.length > 0 ? Math.round((doneStages / project.stages.length) * 100) : 0;

  const upsertDocForThisProject = upsertDocumentItem.bind(null, project.id);
  const updateSubsidyForThisProject = updateSubsidy.bind(null, project.id);
  const addCostForThisProject = addCostEntry.bind(null, project.id);
  const addInvoiceForThisProject = addClientInvoice.bind(null, project.id);
  const addPaymentForThisProject = addPayment.bind(null, project.id);

  type StockWithProduct = (typeof availableStock)[number];
  const groupedAvailable: Record<string, { product: StockWithProduct["product"]; items: StockWithProduct[] }> = {};
  for (const item of availableStock) {
    if (!groupedAvailable[item.productId]) {
      groupedAvailable[item.productId] = { product: item.product, items: [] };
    }
    groupedAvailable[item.productId].items.push(item);
  }

  const reserved = project.stockItems.filter((s) => s.status === "RESERVED");
  const issued = project.stockItems.filter((s) => s.status === "ISSUED");

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{project.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {project.customer.name} &middot; {project.customer.district ?? "—"} &middot; {project.customer.discom ?? "—"} &middot; {project.systemSizeKw} kW
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="border border-amber-200 bg-amber-50 text-amber-800 text-sm rounded-lg px-4 py-3">
              ⚠ {w.message}
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Overall stage progress</span>
          <span>
            {progressPercent}% ({doneStages}/{project.stages.length})
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-amber-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <section className="border border-slate-200 rounded-xl bg-white p-5 space-y-3">
        <h2 className="font-medium text-slate-900">Stages</h2>
        <div className="space-y-3">
          {project.stages.map((stage) => {
            const updateThisStage = updateProjectStage.bind(null, stage.id);
            return (
              <div key={stage.id} className="border border-slate-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-800">
                    {stage.order}. {stage.name}{" "}
                    {stage.requiresAllocation && <span className="text-xs text-slate-400">(requires allocation)</span>}
                  </p>
                  <StatusBadge status={stage.status} />
                </div>
                <form action={updateThisStage} className="grid grid-cols-2 sm:grid-cols-[8rem_1fr_8rem_5rem] gap-2 items-center text-xs">
                  <select name="status" defaultValue={stage.status} className="rounded-lg border border-slate-300 px-2 py-1.5">
                    {STAGE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                  <input
                    name="blockedReason"
                    defaultValue={stage.blockedReason ?? ""}
                    placeholder="Blocked reason (if blocked)"
                    className="rounded-lg border border-slate-300 px-2 py-1.5"
                  />
                  <input
                    type="date"
                    name="targetDate"
                    defaultValue={toDateInput(stage.targetDate)}
                    className="rounded-lg border border-slate-300 px-2 py-1.5"
                  />
                  <button type="submit" className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white px-2 py-1.5">
                    Save
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border border-slate-200 rounded-xl bg-white p-5 space-y-3">
        <h2 className="font-medium text-slate-900">DISCOM approvals</h2>
        <div className="space-y-3">
          {project.approvalSteps.map((step) => {
            const overdue = isApprovalStepOverdue(step);
            const updateThisStep = updateApprovalStep.bind(null, step.id);
            return (
              <div key={step.id} className={`border rounded-lg p-3 ${overdue ? "border-red-300 bg-red-50" : "border-slate-100"}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-slate-800">
                    {step.order}. {step.name}
                  </p>
                  <div className="flex items-center gap-2">
                    {overdue && <span className="text-xs font-medium text-red-600">OVERDUE</span>}
                    <StatusBadge status={step.status} />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  SLA {step.slaDays} days &middot; Required docs: {step.approvalTemplateStep.requiredDocumentTypes.join(", ") || "—"}
                  {step.dueDate && ` · Due ${formatDate(step.dueDate)}`}
                </p>
                {step.deficiencyNotes && <p className="text-xs text-red-600 mb-2">Deficiency: {step.deficiencyNotes}</p>}
                <form action={updateThisStep} className="grid sm:grid-cols-3 gap-2 text-xs">
                  <select name="status" defaultValue={step.status} className="rounded-lg border border-slate-300 px-2 py-1.5">
                    {APPROVAL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                  <select name="officerId" defaultValue={step.officerId ?? ""} className="rounded-lg border border-slate-300 px-2 py-1.5">
                    <option value="">No officer</option>
                    {officers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.designation})
                      </option>
                    ))}
                  </select>
                  <input
                    name="arnNumber"
                    defaultValue={step.arnNumber ?? ""}
                    placeholder="ARN / reference #"
                    className="rounded-lg border border-slate-300 px-2 py-1.5"
                  />
                  <input
                    type="date"
                    name="submissionDate"
                    defaultValue={toDateInput(step.submissionDate)}
                    className="rounded-lg border border-slate-300 px-2 py-1.5"
                  />
                  <input
                    type="date"
                    name="approvalDate"
                    defaultValue={toDateInput(step.approvalDate)}
                    placeholder="Approval date"
                    className="rounded-lg border border-slate-300 px-2 py-1.5"
                  />
                  <input
                    name="deficiencyNotes"
                    defaultValue={step.deficiencyNotes ?? ""}
                    placeholder="Deficiency notes"
                    className="rounded-lg border border-slate-300 px-2 py-1.5"
                  />
                  <input
                    name="responseNotes"
                    defaultValue={step.responseNotes ?? ""}
                    placeholder="Response notes"
                    className="rounded-lg border border-slate-300 px-2 py-1.5 sm:col-span-2"
                  />
                  <button type="submit" className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white px-2 py-1.5">
                    Save
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border border-slate-200 rounded-xl bg-white p-5 space-y-3">
        <h2 className="font-medium text-slate-900">Document checklist</h2>
        <div className="space-y-2">
          {project.documents.map((doc) => (
            <form key={doc.id} action={upsertDocForThisProject} className="grid grid-cols-2 sm:grid-cols-[1fr_8rem_1fr_5rem] gap-2 items-center text-sm">
              <input type="hidden" name="id" value={doc.id} />
              <input type="hidden" name="type" value={doc.type} />
              <span className="text-slate-700">{doc.type}</span>
              <select name="status" defaultValue={doc.status} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
                {DOCUMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input name="remarks" defaultValue={doc.remarks ?? ""} placeholder="Remarks" className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
              <button type="submit" className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white px-2 py-1.5 text-xs">
                Save
              </button>
            </form>
          ))}
        </div>
        <details className="pt-2">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">+ Add document type</summary>
          <form action={upsertDocForThisProject} className="mt-2 grid grid-cols-2 sm:grid-cols-[1fr_8rem_1fr_5rem] gap-2 items-center text-sm">
            <input name="type" required placeholder="Document type" className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
            <select name="status" defaultValue="PENDING" className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
              {DOCUMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input name="remarks" placeholder="Remarks" className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
            <button type="submit" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-2 py-1.5 text-xs">
              Add
            </button>
          </form>
        </details>
      </section>

      {subsidyVisible && (
        <section className="border border-slate-200 rounded-xl bg-white p-5 space-y-3">
          <h2 className="font-medium text-slate-900">Subsidy (PM Surya Ghar)</h2>
          <form action={updateSubsidyForThisProject} className="grid sm:grid-cols-2 gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isEligible" defaultChecked={project.subsidy?.isEligible ?? true} className="rounded border-slate-300" />
              Eligible
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isDbtToCustomer"
                defaultChecked={project.subsidy?.isDbtToCustomer ?? true}
                className="rounded border-slate-300"
              />
              DBT to customer (not company revenue)
            </label>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Expected amount (₹)</label>
              <input
                type="number"
                name="expectedAmount"
                defaultValue={project.subsidy?.expectedAmount ?? 0}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Reference number</label>
              <input
                name="referenceNumber"
                defaultValue={project.subsidy?.referenceNumber ?? ""}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Claim date</label>
              <input
                type="date"
                name="claimDate"
                defaultValue={toDateInput(project.subsidy?.claimDate)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Received date</label>
              <input
                type="date"
                name="receivedDate"
                defaultValue={toDateInput(project.subsidy?.receivedDate)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-sm px-4 py-2">
                Save
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="border border-slate-200 rounded-xl bg-white p-5 space-y-4">
        <h2 className="font-medium text-slate-900">Material allocated to this project</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-2 py-1 font-medium">Serial</th>
              <th className="px-2 py-1 font-medium">Product</th>
              <th className="px-2 py-1 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {project.stockItems.map((s) => (
              <tr key={s.id} className="border-b border-slate-50 last:border-0">
                <td className="px-2 py-1.5 font-mono text-xs">{s.serialNumber}</td>
                <td className="px-2 py-1.5 text-slate-600">{s.product.name}</td>
                <td className="px-2 py-1.5">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
            {project.stockItems.length === 0 && (
              <tr>
                <td colSpan={3} className="px-2 py-3 text-slate-400 text-center">
                  No material allocated yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {reserved.length > 0 && (
          <form action={issueStock} className="border-t border-slate-100 pt-3">
            <input type="hidden" name="projectId" value={project.id} />
            <p className="text-xs text-slate-500 mb-2">Mark reserved items as issued to site:</p>
            <div className="space-y-1 mb-2">
              {reserved.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-xs">
                  <input type="checkbox" name="stockItemIds" value={s.id} className="rounded border-slate-300" />
                  {s.serialNumber} — {s.product.name}
                </label>
              ))}
            </div>
            <button type="submit" className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-xs px-3 py-1.5">
              Mark issued
            </button>
          </form>
        )}

        {canConfirmInstalled && issued.length > 0 && (
          <form action={confirmInstalled} className="border-t border-slate-100 pt-3">
            <input type="hidden" name="projectId" value={project.id} />
            <p className="text-xs text-slate-500 mb-2">Confirm installed serials:</p>
            <div className="space-y-1 mb-2">
              {issued.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-xs">
                  <input type="checkbox" name="stockItemIds" value={s.id} className="rounded border-slate-300" />
                  {s.serialNumber} — {s.product.name}
                </label>
              ))}
            </div>
            <button type="submit" className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5">
              Confirm installed
            </button>
          </form>
        )}

        {stockMutator && Object.keys(groupedAvailable).length > 0 && (
          <form action={allocateStock} className="border-t border-slate-100 pt-3">
            <input type="hidden" name="projectId" value={project.id} />
            <p className="text-xs text-slate-500 mb-2">Allocate available stock:</p>
            <div className="space-y-2 mb-2 max-h-48 overflow-auto">
              {Object.values(groupedAvailable).map(({ product, items }) => (
                <div key={product.id}>
                  <p className="text-xs font-medium text-slate-600">{product.name}</p>
                  {items.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-xs ml-2">
                      <input type="checkbox" name="stockItemIds" value={item.id} className="rounded border-slate-300" />
                      {item.serialNumber}
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <button type="submit" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5">
              Allocate selected
            </button>
          </form>
        )}
      </section>

      {financeVisible && (
        <>
          <section className="border border-slate-200 rounded-xl bg-white p-5 space-y-3">
            <h2 className="font-medium text-slate-900">Cost ledger</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="px-2 py-1 font-medium">Date</th>
                  <th className="px-2 py-1 font-medium">Category</th>
                  <th className="px-2 py-1 font-medium">Description</th>
                  <th className="px-2 py-1 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {project.costEntries.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-2 py-1.5 text-slate-600">{formatDate(c.date)}</td>
                    <td className="px-2 py-1.5 text-slate-600">{c.category.replaceAll("_", " ")}</td>
                    <td className="px-2 py-1.5 text-slate-600">{c.description ?? "—"}</td>
                    <td className="px-2 py-1.5 text-slate-800">{formatCurrency(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <details>
              <summary className="cursor-pointer text-sm font-medium text-slate-700">+ Add cost entry</summary>
              <form action={addCostForThisProject} className="mt-2 grid sm:grid-cols-4 gap-2 text-xs">
                <select name="category" className="rounded-lg border border-slate-300 px-2 py-1.5">
                  {COST_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <input type="number" step="0.01" name="amount" placeholder="Amount" required className="rounded-lg border border-slate-300 px-2 py-1.5" />
                <input type="date" name="date" className="rounded-lg border border-slate-300 px-2 py-1.5" />
                <input name="description" placeholder="Description" className="rounded-lg border border-slate-300 px-2 py-1.5" />
                <button type="submit" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 sm:col-span-4 w-fit">
                  Add
                </button>
              </form>
            </details>
          </section>

          <section className="border border-slate-200 rounded-xl bg-white p-5 space-y-3">
            <h2 className="font-medium text-slate-900">Client invoices &amp; payments</h2>
            {project.clientInvoices.map((inv) => {
              const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
              return (
                <div key={inv.id} className="border border-slate-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs text-slate-500">{inv.invoiceNumber}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <p className="text-sm text-slate-700">
                    {inv.milestoneType.replaceAll("_", " ")} — {formatCurrency(inv.amount)} (paid {formatCurrency(paid)})
                  </p>
                  {inv.payments.length > 0 && (
                    <ul className="text-xs text-slate-500 space-y-0.5">
                      {inv.payments.map((p) => (
                        <li key={p.id}>
                          {formatDate(p.date)} — {formatCurrency(p.amount)} ({p.mode})
                        </li>
                      ))}
                    </ul>
                  )}
                  {paid < inv.amount && (
                    <form action={addPaymentForThisProject} className="flex flex-wrap gap-2 items-end text-xs pt-2 border-t border-slate-100">
                      <input type="hidden" name="clientInvoiceId" value={inv.id} />
                      <input
                        type="number"
                        step="0.01"
                        name="amount"
                        placeholder="Amount"
                        required
                        defaultValue={inv.amount - paid}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 w-28"
                      />
                      <select name="mode" className="rounded-lg border border-slate-300 px-2 py-1.5">
                        {PAYMENT_MODES.map((m) => (
                          <option key={m} value={m}>
                            {m.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                      <input name="referenceNumber" placeholder="Reference #" className="rounded-lg border border-slate-300 px-2 py-1.5" />
                      <input type="date" name="date" className="rounded-lg border border-slate-300 px-2 py-1.5" />
                      <button type="submit" className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white px-3 py-1.5">
                        Record payment
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
            <details>
              <summary className="cursor-pointer text-sm font-medium text-slate-700">+ New client invoice</summary>
              <form action={addInvoiceForThisProject} className="mt-2 grid sm:grid-cols-3 gap-2 text-xs">
                <input name="invoiceNumber" placeholder="Invoice #" required className="rounded-lg border border-slate-300 px-2 py-1.5" />
                <select name="milestoneType" className="rounded-lg border border-slate-300 px-2 py-1.5">
                  {MILESTONE_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {m.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <input type="number" step="0.01" name="amount" placeholder="Amount" required className="rounded-lg border border-slate-300 px-2 py-1.5" />
                <select name="status" defaultValue="DRAFT" className="rounded-lg border border-slate-300 px-2 py-1.5">
                  {INVOICE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <input type="date" name="issueDate" className="rounded-lg border border-slate-300 px-2 py-1.5" />
                <input type="date" name="dueDate" className="rounded-lg border border-slate-300 px-2 py-1.5" />
                <button type="submit" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 sm:col-span-3 w-fit">
                  Create invoice
                </button>
              </form>
            </details>
          </section>

          <section className="border border-slate-200 rounded-xl bg-white p-5">
            <h2 className="font-medium text-slate-900 mb-3">Margin</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <StatCard label="Contract value" value={formatCurrency(margin.contractValue)} />
              <StatCard label="Invoiced revenue" value={formatCurrency(margin.invoicedRevenue)} />
              <StatCard
                label="Total cost"
                value={formatCurrency(margin.totalCost)}
                hint={`Panels/inverters ${formatCurrency(margin.panelInverterCost)} + other ${formatCurrency(margin.otherCost)}`}
              />
              <StatCard label="Expected margin" value={`${formatCurrency(margin.expectedMargin)} (${margin.expectedMarginPercent.toFixed(1)}%)`} />
              <StatCard label="Actual margin" value={`${formatCurrency(margin.actualMargin)} (${margin.actualMarginPercent.toFixed(1)}%)`} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
