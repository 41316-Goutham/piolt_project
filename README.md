# SunPower GeneSys

Operations platform for **SunPower GeneSys**, a rooftop solar EPC channel
partner working with OEM brands such as Waaree, Adani Solar and Luminous.

The app has two portals:

- **Admin console** (`/admin`) — overview dashboard, inventory across all
  brands, sales, project timelines with milestones, and invoices.
- **Customer portal** (`/portal`) — customers sign in to see their own
  project's status, sanctioned amount, subsidy amount, milestone timeline,
  and invoices.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript, Tailwind CSS v4)
- [Prisma](https://www.prisma.io) ORM against a [Supabase](https://supabase.com) Postgres database
- [Auth.js / NextAuth v5](https://authjs.dev) with a credentials provider and
  role-based access (`ADMIN` / `CUSTOMER`) enforced in `src/proxy.ts`

## Getting started

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, DIRECT_URL, and a random AUTH_SECRET
npm run db:push           # create the schema in your Supabase database
npm run db:seed           # load demo data (customers, projects, invoices...)
npm run dev
```

`DATABASE_URL` and `DIRECT_URL` come from your Supabase project's
**Project Settings → Database → Connection string**: the pooled connection
(port `6543`) for `DATABASE_URL`, the direct connection (port `5432`) for
`DIRECT_URL` (Prisma needs the direct one for schema pushes/migrations).

Open http://localhost:3000.

### Demo credentials (from the seed script)

| Role     | Email                          | Password      |
|----------|---------------------------------|---------------|
| Admin    | admin@sunpowergenesys.com       | Admin@123     |
| Customer | ravi.kumar@example.com          | Customer@123  |
| Customer | anjali.mehta@example.com        | Customer@123  |
| Customer | suresh.rao@example.com          | Customer@123  |

Change these before using the app with real data.

## Data model

Defined in `prisma/schema.prisma`:

- `User` — admin or customer, with hashed password and role
- `Company` — OEM/channel brand (Waaree, Adani Solar, Luminous, ...)
- `InventoryItem` — stock per brand with reorder levels
- `Project` — a customer's solar installation: capacity, sanctioned amount,
  subsidy, status, progress percent
- `Milestone` — ordered timeline steps per project
- `Sale` — inventory sold against a project
- `Invoice` — billing tied to a project

## Deploying to production (Vercel + Supabase)

This repo is connected to Vercel for hosting and Supabase for the database.
In the Vercel project's **Settings → Environment Variables**, set:

- `DATABASE_URL` — the Supabase pooled connection string (port `6543`,
  `?pgbouncer=true`)
- `DIRECT_URL` — the Supabase direct connection string (port `5432`), used
  only for schema pushes/migrations
- `AUTH_SECRET` — a random 32-byte base64 string, different from local dev

Then, from your machine (with the same values set locally in `.env`), run
`npm run db:push` once against the Supabase database to create the schema,
and `npm run db:seed` to load demo data (or skip seeding and create a real
admin user directly).

## Known audit notes

`npm audit` flags transitive vulnerabilities in Prisma's optional MySQL
driver dependency (`mysql2`), which is unused since this project only
connects to Postgres. No action needed unless a MySQL datasource is added
later.
