import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { getCustomerForUser } from "@/lib/customer";

const NAV_ITEMS = [
  { href: "/portal", label: "My projects" },
  { href: "/portal/timeline", label: "Timeline" },
  { href: "/portal/documents", label: "Documents" },
  { href: "/portal/subsidy", label: "Subsidy" },
  { href: "/portal/invoices", label: "Invoices" },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "CUSTOMER") {
    redirect("/login");
  }

  const customer = await getCustomerForUser(session.user.id);
  if (!customer) {
    redirect("/login?error=NoCustomerRecord");
  }

  return (
    <AppShell brandLabel="Customer portal" userName={session.user.name ?? "Customer"} navItems={NAV_ITEMS}>
      {children}
    </AppShell>
  );
}
