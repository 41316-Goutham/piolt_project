import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";

const NAV_ITEMS = [
  { href: "/portal", label: "My projects" },
  { href: "/portal/timeline", label: "Timeline" },
  { href: "/portal/invoices", label: "Invoices" },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "CUSTOMER") {
    redirect("/login");
  }

  return (
    <AppShell brandLabel="Customer portal" userName={session.user.name ?? "Customer"} navItems={NAV_ITEMS}>
      {children}
    </AppShell>
  );
}
