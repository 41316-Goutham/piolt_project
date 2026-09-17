const STYLES: Record<string, string> = {
  LEAD: "bg-slate-100 text-slate-600",
  SANCTIONED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  INSTALLED: "bg-indigo-100 text-indigo-700",
  COMMISSIONED: "bg-emerald-100 text-emerald-700",
  ON_HOLD: "bg-red-100 text-red-700",
  PENDING: "bg-slate-100 text-slate-600",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  DELAYED: "bg-red-100 text-red-700",
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
