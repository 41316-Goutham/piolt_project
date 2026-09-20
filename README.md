# SunPower GeneSys

Operations platform for **SunPower GeneSys**, a rooftop solar EPC channel
partner in Andhra Pradesh (APSPDCL DISCOM territory). It buys panels from
manufacturers such as Waaree, wins rooftop solar contracts, pushes them
through DISCOM feasibility and PM Surya Ghar central subsidy paperwork,
hires installation crews, and tracks margin per project.

Scope and requirements are defined in [`PRD_Andhra_Pradesh.md`](./PRD_Andhra_Pradesh.md).
This build implements **Phase 1a**: the core data model plus the
higher-value parts of the pilot MVP — see "What's implemented" below for the
exact boundary.

The app has two portals:

- **Admin console** (`/admin`) — role-based views for leads, customers,
  projects (with DISCOM approval workflow, document checklist, subsidy
  tracking), serial-level inventory (purchase invoices, GRN, allocation,
  traceability), finance (cost ledger, client invoices/payments, margin),
  officer directory, and admin-editable templates/subsidy slabs.
- **Customer portal** (`/portal`) — customers sign in to see their own
  project's stage progress, subsidy status, document checklist, and
  invoices/payments.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript, Tailwind CSS v4)
- [Prisma](https://www.prisma.io) ORM against a [Supabase](https://supabase.com) Postgres database
- [Auth.js / NextAuth v5](https://authjs.dev) with a credentials provider;
  role-based access enforced in `src/proxy.ts` (internal roles vs.
  `CUSTOMER`) and page/action-level checks in `src/lib/roles.ts` for the
  two PRD-mandated rules (workers can't see finance, sales can't mutate
  stock)

## Getting started

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, DIRECT_URL, and a random AUTH_SECRET
npm run db:push           # create the schema in your Supabase database
npm run db:seed           # load demo data (customers, leads, projects, inventory...)
npm run dev
```

`DATABASE_URL` and `DIRECT_URL` come from your Supabase project's
**Project Settings → Database → Connection string**: the pooled connection
(port `6543`) for `DATABASE_URL`, the direct/session-pooler connection
(port `5432`) for `DIRECT_URL` (Prisma needs the direct one for schema
pushes/migrations — use the Session Pooler variant if your network can't
reach Supabase's direct `db.*.supabase.co` host, which requires IPv6).

Open http://localhost:3000.

### Demo credentials (from the seed script)

| Role | Email | Password |
|---|---|---|
| Admin | admin@sunpowergenesys.com | Admin@123 |
| Sales | sales@sunpowergenesys.com | Sales@123 |
| Liaison | liaison@sunpowergenesys.com | Liaison@123 |
| Inventory Manager | inventory@sunpowergenesys.com | Inventory@123 |
| Site Supervisor | supervisor@sunpowergenesys.com | Supervisor@123 |
| Accounts | accounts@sunpowergenesys.com | Accounts@123 |
| Worker | worker@sunpowergenesys.com | Worker@123 |
| Customer | ravi.kumar@example.com | Customer@123 |
| Customer | lakshmi.reddy@example.com | Customer@123 |
| Customer | krishna.murthy@example.com | Customer@123 |

The seed also creates a commercial customer (Venkatesh Rao) with **no**
portal login, to demonstrate that a `Customer` record can exist without one.
Change all of these before using the app with real data.

### Seeded demo scenarios worth looking at

- **Kumar Residence** (Ravi Kumar) — mid-progress project with an
  intentionally overdue DISCOM approval step, and a system size (5 kW)
  larger than the customer's sanctioned load (4 kW) to demonstrate the
  oversize rule-warning banner.
- **Venkatesh Industrial Shed** (commercial customer) — subsidy marked
  ineligible (PM Surya Ghar is residential-only), and has non-ALMM-compliant
  Adani panels allocated, to demonstrate the ALMM rule-warning banner.
- **Reddy Residence** — an early-stage project with no material allocated
  yet, showing the pipeline before the allocation gate is satisfied.
- **Murthy Residence** — a fully closed, fully paid project for a clean
  margin example.

## Data model

Defined in `prisma/schema.prisma` — see the PRD's Section 8 for the
conceptual model this implements. Key tables: `User` / `Customer` / `Lead`,
`Project` / `ProjectStage` (from an editable `StageTemplate`), `ApprovalStep`
/ `Officer` (from an editable `ApprovalTemplate`), `DocumentItem`,
`Supplier` / `Product` / `PurchaseInvoice` / `GRN`, `StockItem` (serial-level,
panels/inverters) / `StockConsumption` (bulk categories), `SubsidySlab` /
`Subsidy`, `CostEntry` / `ClientInvoice` / `Payment`.

Business rules enforced in code (`src/lib/rules.ts`, `src/lib/roles.ts`):
duplicate serial numbers are rejected (DB-unique + pre-validation in the GRN
action), a project can't advance a stage flagged `requiresAllocation`
without allocated stock, workers can't view finance/margin, and sales can't
mutate stock.

## What's implemented (Phase 1a) vs. deferred

**Implemented:** the data model above; lead → project conversion that
instantiates the DISCOM stage and approval workflow; document checklist;
officer directory; serial-level inventory with GRN, allocation, issue,
install-confirmation, and traceability search; PM Surya Ghar subsidy
tracking against an editable slab table; project cost ledger, client
invoices/payments, and computed margin (expected vs. actual); an
admin-editable settings page for stage/approval templates and subsidy
slabs; an owner dashboard (stage counts, delayed projects, receivables,
stock, margin); the customer portal extended with stage progress, subsidy,
and documents.

**Explicitly deferred** (see the PRD's own phase plan — this is not all of
Phase 1 MVP, let alone Phase 2/3): crew/worker attendance and site task
checklists with photos; quotation builder; customer financing tracker;
customer OTP sign-off; real file/photo uploads (`DocumentItem.fileUrl` is a
text reference only — no object storage is wired up yet); outbound
notifications (email/WhatsApp/SMS) and automatic SLA escalation (overdue is
computed and displayed, not pushed); barcode/QR scanning; physical stock
audits; a full returns/damage claim workflow; two-factor auth; a full audit
log; GST/Tally export; a Kanban board (filterable list instead); a full
DISCOM/district mapping config UI (DISCOM is an enum, officer
circle/division/section are free text).

## Deploying to production (Vercel + Supabase)

This repo is connected to Vercel for hosting and Supabase for the database.
In the Vercel project's **Settings → Environment Variables**, set:

- `DATABASE_URL` — the Supabase pooled connection string (port `6543`,
  `?pgbouncer=true`)
- `DIRECT_URL` — the Supabase direct/session-pooler connection string
  (port `5432`), used only for schema pushes/migrations
- `AUTH_SECRET` — a random 32-byte base64 string, different from local dev

**Enter these as raw values with no surrounding quote characters** — a
common mistake is pasting `"postgresql://..."` including the quotes from a
`.env` file, which breaks the connection string. Values are stored as
Secrets so they can't be read back afterward; if login/inventory pages
error out with a Prisma connection error, re-set the variables from
scratch rather than assuming the stored value is correct.

Then, from your machine (with the same values set locally in `.env`), run
`npm run db:push` once against the Supabase database to create the schema,
and `npm run db:seed` to load demo data (or skip seeding and create a real
admin user directly).

## Known audit notes

`npm audit` flags transitive vulnerabilities in Prisma's optional MySQL
driver dependency (`mysql2`), which is unused since this project only
connects to Postgres. No action needed unless a MySQL datasource is added
later.

## Known local-environment quirk

A stray nested clone of this repo (a folder literally named `piolt_project`,
matching the GitHub repo name) has repeatedly reappeared at the project
root on this machine, from a source we haven't identified (not created by
any command run in this project). It's excluded from git (`.gitignore`) and
from the TypeScript build (`tsconfig.json`), so it shouldn't break tooling,
but if you see it recur, it's worth checking for a sync/backup tool or
script on this machine that might be cloning the repo automatically.
