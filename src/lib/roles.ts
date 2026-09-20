import type { Role } from "@prisma/client";

export const INTERNAL_ROLES: Role[] = [
  "ADMIN",
  "SALES",
  "LIAISON",
  "INVENTORY_MANAGER",
  "SITE_SUPERVISOR",
  "ACCOUNTS",
  "WORKER",
];

export function isInternalRole(role: Role): boolean {
  return INTERNAL_ROLES.includes(role);
}

// PRD acceptance criterion: "workers cannot see finance"
export function canViewFinance(role: Role): boolean {
  return role === "ADMIN" || role === "ACCOUNTS";
}

// PRD acceptance criterion: "sales cannot edit stock"
export function canMutateStock(role: Role): boolean {
  return role === "ADMIN" || role === "INVENTORY_MANAGER";
}

// Subsidy tracking is a Liaison responsibility per the PRD, not pure finance —
// only workers (limited to attendance/tasks) are excluded from seeing it.
export function canViewSubsidyDetails(role: Role): boolean {
  return role !== "WORKER";
}

export function roleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    ADMIN: "Admin",
    SALES: "Sales",
    LIAISON: "Liaison",
    INVENTORY_MANAGER: "Inventory Manager",
    SITE_SUPERVISOR: "Site Supervisor",
    ACCOUNTS: "Accounts",
    WORKER: "Worker",
    CUSTOMER: "Customer",
  };
  return labels[role];
}
