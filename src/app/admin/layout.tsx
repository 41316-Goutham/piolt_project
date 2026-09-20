import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { isInternalRole, canViewFinance } from "@/lib/roles";
import type { Role } from "@prisma/client";

function getNavItems(role: Role) {
  const items = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/leads", label: "Leads" },
    { href: "/admin/customers", label: "Customers" },
    { href: "/admin/projects", label: "Projects" },
    { href: "/admin/inventory", label: "Inventory" },
  ];
  if (role === "ADMIN" || role === "LIAISON") {
    items.push({ href: "/admin/officers", label: "Officers" });
  }
  if (canViewFinance(role)) {
    items.push({ href: "/admin/finance", label: "Finance" });
  }
  if (role === "ADMIN") {
    items.push({ href: "/admin/settings/templates", label: "Settings" });
  }
  return items;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || !isInternalRole(session.user.role)) {
    redirect("/login");
  }

  return (
    <AppShell
      brandLabel="Admin console"
      userName={session.user.name ?? "Admin"}
      navItems={getNavItems(session.user.role)}
    >
      {children}
    </AppShell>
  );
}
