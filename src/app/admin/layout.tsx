import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/invoices", label: "Invoices" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <AppShell brandLabel="Admin console" userName={session.user.name ?? "Admin"} navItems={NAV_ITEMS}>
      {children}
    </AppShell>
  );
}
