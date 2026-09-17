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
- [Prisma](https://www.prisma.io) ORM with SQLite for local development
- [Auth.js / NextAuth v5](https://authjs.dev) with a credentials provider and
  role-based access (`ADMIN` / `CUSTOMER`) enforced in `src/proxy.ts`

## Getting started

```bash
npm install
cp .env.example .env      # set DATABASE_URL and a random AUTH_SECRET
npm run db:push           # create the SQLite schema
npm run db:seed           # load demo data (customers, projects, invoices...)
npm run dev
```

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

## Deploying to production (Vercel)

This repo is connected to Vercel. Two things need to change for a real
production deployment:

1. **Database**: SQLite is a local file and does not persist on Vercel's
   serverless runtime. Provision a hosted Postgres database (e.g.
   [Neon](https://neon.tech) or [Vercel Postgres](https://vercel.com/storage/postgres)),
   change the `datasource` provider in `prisma/schema.prisma` from `sqlite`
   to `postgresql`, and set `DATABASE_URL` in the Vercel project's
   environment variables.
2. **Secrets**: set `AUTH_SECRET` (a random 32-byte base64 string) in the
   Vercel project's environment variables — do not reuse the local `.env`
   value.

After that, run `npx prisma db push` (or a migration) against the production
database once, then seed it or create the admin user manually.

## Known audit notes

`npm audit` flags transitive vulnerabilities in Prisma's optional MySQL
driver dependency (`mysql2`), which is unused since this project only
connects to SQLite/Postgres. No action needed unless a MySQL datasource is
added later.
