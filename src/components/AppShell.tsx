import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

export function AppShell({
  brandLabel,
  userName,
  navItems,
  children,
}: {
  brandLabel: string;
  userName: string;
  navItems: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-5 py-5 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-amber-500 inline-block" />
            <span className="font-semibold text-sm text-slate-900">SunPower GeneSys</span>
          </Link>
          <p className="text-xs text-slate-400 mt-1">{brandLabel}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6">
          <p className="text-sm text-slate-500">Welcome, {userName}</p>
          <SignOutButton />
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
