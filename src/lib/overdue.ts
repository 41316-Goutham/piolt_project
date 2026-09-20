import type { ApprovalStep } from "@prisma/client";

const TERMINAL_STATUSES = ["APPROVED", "REJECTED"];

export function isApprovalStepOverdue(step: Pick<ApprovalStep, "status" | "dueDate">): boolean {
  if (!step.dueDate) return false;
  if (TERMINAL_STATUSES.includes(step.status)) return false;
  return step.dueDate.getTime() < Date.now();
}
