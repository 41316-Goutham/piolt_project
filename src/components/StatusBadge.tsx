const STYLES: Record<string, string> = {
  // Lead status
  NEW: "bg-slate-100 text-slate-600",
  SITE_SURVEY: "bg-blue-100 text-blue-700",
  QUOTED: "bg-indigo-100 text-indigo-700",
  NEGOTIATION: "bg-amber-100 text-amber-700",
  WON: "bg-emerald-100 text-emerald-700",
  LOST: "bg-red-100 text-red-700",
  // Project status
  ACTIVE: "bg-blue-100 text-blue-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  CLOSED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  // Stage / approval status
  NOT_STARTED: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  BLOCKED: "bg-red-100 text-red-700",
  DONE: "bg-emerald-100 text-emerald-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  QUERY_RAISED: "bg-red-100 text-red-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  // Document status
  PENDING: "bg-slate-100 text-slate-600",
  RECEIVED: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  // Stock item status
  IN_STOCK: "bg-slate-100 text-slate-600",
  RESERVED: "bg-indigo-100 text-indigo-700",
  ISSUED: "bg-amber-100 text-amber-700",
  INSTALLED: "bg-emerald-100 text-emerald-700",
  RETURNED: "bg-slate-100 text-slate-600",
  DAMAGED: "bg-red-100 text-red-700",
  WARRANTY_CLAIM: "bg-red-100 text-red-700",
  // Invoice status
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${style}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
