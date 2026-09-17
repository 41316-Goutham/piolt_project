import Link from "next/link";

const partners = ["Waaree", "Adani Solar", "Vikram Solar", "Tata Power Solar"];

const features = [
  {
    title: "Admin Control Center",
    description:
      "Track inventory, sales, project timelines, and invoices across every channel-partner brand from one dashboard.",
  },
  {
    title: "Customer Portal",
    description:
      "Give homeowners and businesses live visibility into sanctioned amount, installation progress, and milestones.",
  },
  {
    title: "Multi-Brand Inventory",
    description:
      "Manage panels, inverters, batteries and BOS components across OEM partners with reorder alerts.",
  },
  {
    title: "Invoicing & Payments",
    description:
      "Issue, track, and reconcile invoices tied directly to each project's stage and subsidy status.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-100">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-full bg-amber-500 inline-block" />
            <span className="font-semibold">SunPower GeneSys</span>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-700 transition-colors"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-amber-600 font-medium text-sm tracking-wide uppercase mb-3">
          Solar EPC &middot; Channel Partner Platform
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
          Powering rooftops, one project at a time
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg mb-10">
          SunPower GeneSys is a channel partner delivering solar installations
          in partnership with leading manufacturers like Waaree. This
          platform runs our operations end-to-end and gives customers a live
          window into their project.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 text-sm transition-colors"
          >
            Admin sign in
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 hover:border-slate-400 text-slate-700 font-medium px-6 py-3 text-sm transition-colors"
          >
            Track my project
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="border border-slate-200 rounded-xl p-5 hover:border-amber-300 transition-colors"
            >
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <p className="text-sm text-slate-400 mb-4 uppercase tracking-wide">
            Channel partner for
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-slate-500 font-medium">
            {partners.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} SunPower GeneSys. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
