# Product Requirements Document: SunPowerGenesys Operations Platform

| | |
|---|---|
| **Product** | SunPowerGenesys Operations Platform (working title) |
| **Version** | 1.0 (draft) |
| **Date** | 20 September 2026 |
| **Status** | Draft for review |
| **Current state** | Simple pilot hosted on Vercel |
| **Primary market** | Andhra Pradesh, India — APSPDCL jurisdiction (extensible to other DISCOMs/states) |

---

## 1. Executive Summary

SunPowerGenesys is a solar channel partner. It buys modules from manufacturers such as Waaree Energies, wins rooftop solar contracts, obtains DISCOM and subsidy approvals, hires installation crews, and earns a margin between the client's payment and its total cost.

Today this work is spread across invoices, spreadsheets, phone calls and paper files. This document defines the requirements for a single web application that tracks a project from lead to final payment, and tracks every panel from purchase invoice to the customer's roof.

The platform has four core pillars:

1. **Project and customer pipeline:** leads, contracts, status, and timeline.
2. **Approvals and subsidy paperwork:** APSPDCL feasibility, net-metering, inspection, and subsidy claim tracking, with document checklists.
3. **Inventory:** purchase invoices from manufacturers, serial-number-level stock, allocation to projects.
4. **Execution and finance:** installation crew and site progress, client payments, costs, and margin per project.

---

## 2. Business Context

### 2.1 Business model (as described by the company)

1. Buy panels from manufacturers (for example Waaree Technologies/Energies). A purchase invoice is issued in the company's name.
2. Find and sign solar project contracts with customers.
3. Obtain required approvals from the DISCOM — in this market, **APSPDCL** (Southern Power Distribution Company of Andhra Pradesh Limited) — typically at the Assistant Engineer (Renewable) or Assistant Divisional Engineer level at the section/sub-division office.
4. Where eligible, the customer claims a government subsidy under the applicable policy.
5. After the paperwork is complete, hire installation workers and manage work end to end at the client's site.
6. The client pays SunPowerGenesys. The margin is client revenue minus panel, materials, labour, and other costs.

### 2.2 Industry workflow reference (Andhra Pradesh residential rooftop, APSPDCL)

The following summarizes publicly available information gathered from installer and consumer guides in September 2026. **These are third-party sources and rules change often. Every rule below must be verified against the official PM Surya Ghar portal (pmsuryaghar.gov.in), APSPDCL, NREDCAP, and APERC regulations before being hard-coded into the product.** The app should keep such rules in editable configuration, not in code.

**Central subsidy (PM Surya Ghar: Muft Bijli Yojana)**

- Residential systems only. Commercial projects are not eligible.
- Commonly reported central subsidy slabs: ₹30,000 for 1 kW, ₹60,000 for 2 kW, and ₹78,000 for 3 kW or above, with no additional subsidy above 3 kW.
- Application runs through the National Portal for Rooftop Solar: register with state, DISCOM, and consumer/service number; apply; obtain DISCOM feasibility; pick an empanelled vendor; install; DISCOM inspection and net meter; upload commissioning report; subsidy is paid by direct benefit transfer to the customer's bank account.
- Subsidy payment timing is reported at roughly 30 days after commissioning sign-off, though other national guides suggest 1-3 months is also common.
- Modules must be ALMM-listed (Approved List of Models and Manufacturers) with BIS-certified inverters. Non-ALMM panels can cause inspection failure and loss of subsidy.
- Installer must be an MNRE-empanelled vendor. Sources indicate Andhra Pradesh does **not** currently run a separate state-level top-up subsidy on top of the central scheme — this must be confirmed with NREDCAP, as state policy changes periodically.
- Collateral-free loans of up to ₹2 lakh at concessional rates are reported nationally for eligible systems; confirm local bank participation.

**Andhra Pradesh / APSPDCL specifics**

- Andhra Pradesh's distribution is split across **three DISCOMs**: **APSPDCL** (Southern Power Distribution Company, headquartered at Tirupati — Rayalaseema and southern coastal districts such as Chittoor, Tirupati, Nellore, Prakasam, YSR Kadapa, Kurnool, Anantapur, and Sri Sathya Sai), **APEPDCL** (Eastern Power Distribution Company — Visakhapatnam, East Godavari, West Godavari, Krishna, Guntur belt), and **APCPDCL** (Central Power Distribution Company). Sources disagree on naming and exact district boundaries (one guide referred to a fourth entity, "APNPDCL," which could not be corroborated against official APSPDCL/APCPDCL sites), so **the DISCOM list and district mapping must be verified directly with APSPDCL/NREDCAP and kept in editable configuration**, not assumed from this document.
- **NREDCAP** (New and Renewable Energy Development Corporation of Andhra Pradesh Ltd.) is the state nodal agency: it maintains the empanelled vendor list and coordinates PM Surya Ghar implementation with the DISCOMs, similar to UPNEDA's role in UP.
- **APERC** (Andhra Pradesh Electricity Regulatory Commission) regulates net/gross metering under the AP Solar Rooftop Net Metering framework (originally notified 2015, with subsequent amendment orders, including on Net-Gross Metering). Net metering uses **annual banking**: monthly surplus units carry forward and are settled at financial year-end at an export/APPC-linked rate, reported in the neighborhood of ₹2.50-3.50 per unit for residential exports — confirm the current APERC-approved rate.
- Reported six-stage APSPDCL process and indicative timeline (varies significantly by source, so treat as directional only):
  1. **Pre-application prep** — verify APSPDCL service connection number, confirm sanctioned load against desired system size, ensure Aadhaar-bank linkage, check name consistency across documents.
  2. **National portal registration** — submit via pmsuryaghar.gov.in with service number and documents; an Application Reference Number (ARN) is generated.
  3. **APSPDCL feasibility review** — the DISCOM's renewable energy cell checks transformer capacity, sanctioned-load match, and documentation completeness. Reported at roughly 10-18 working days, though other sources suggest the overall feasibility-to-installation window in APSPDCL territory can run considerably longer (2-3 months) versus the coastal APEPDCL area.
  4. **Vendor selection and installation** — an MNRE-empanelled vendor installs using ALMM-listed panels and BIS-certified inverters; coastal/cyclone-prone zones may require wind/cyclone-rated mounting structures per IS 875 Part 3.
  5. **Net meter inspection** — an APSPDCL field engineer (reported designation: **Assistant Engineer, Operations**) inspects panel specification, inverter details, earthing, mounting integrity, and isolator placement.
  6. **Subsidy disbursement** — central subsidy is transferred via DBT after commissioning sign-off.
- Reported officer designations relevant to the approval workflow: **Assistant Engineer (Renewable)** at the section office for feasibility review, and **Assistant Engineer (Operations)** for the net-meter inspection; some projects may also require Assistant Divisional Engineer or Divisional Engineer sign-off depending on load size and division practice. **These designations should be confirmed with APSPDCL and kept editable**, since they were reported only by third-party guides, not the official APSPDCL page.
- APSPDCL's own official site (apspdcl.in) hosts the "Solar Rooftop Net Metering Policy 2015" and a revised "Application for Solar Projects" form, but does not publish a public step-by-step timeline — official confirmation should come from that documentation or by contacting APSPDCL customer care (toll-free 1912 / 1800-425-155333).
- System size cannot exceed the customer's sanctioned load; a load-enhancement request through the section/division office would be needed otherwise (consistent with the general Indian DISCOM pattern, not confirmed AP-specific).
- Documents commonly required: recent APSPDCL bill (paid, typically last 3 months), Aadhaar (front/back), PAN, cancelled cheque or bank passbook, property ownership proof (tax receipt or deed), society/apartment association NOC where applicable, dated rooftop photographs (all corners visible), self-declaration form, and the vendor's technical feasibility/commissioning documentation.

**Inventory practice in solar distribution/installation**

- Serial-number tracking of every panel and inverter from receipt to installation to warranty registration is standard practice, as it supports warranty claims, recalls, and site-level traceability.
- Lot/batch tracking, multi-location stock (warehouse, vehicle, site), low-stock reorder alerts, and allocation of stock to specific jobs are standard features.
- Panels must be reserved to a project before crews load out, to avoid a crew arriving without equipment or wrong equipment being sent to a site.

---

## 3. Problem Statement

- Paperwork stages are tracked informally, so delays with APSPDCL officers or missing documents are found late.
- Panel serial numbers are not tied to purchase invoices and customer sites, which makes ALMM proof, warranty claims, and inspection responses slow and error-prone.
- Margin per project is unknown until well after completion because costs are scattered.
- Owners cannot see, in one place, what is pending approval, what is installing, and what money is due.

---

## 4. Goals and Non-Goals

### 4.1 Goals

- G1. One record per project showing stage, blockers, documents, assigned people, and money.
- G2. Serial-level traceability from manufacturer invoice to customer site.
- G3. Configurable approval and subsidy workflow with reminders and SLA tracking.
- G4. Per-project profitability visible in real time.
- G5. Simple enough for non-technical staff and site supervisors on a phone.

### 4.2 Non-Goals (v1)

- Direct integration with government portals (no official public API is assumed; data is entered manually or via document upload).
- Full accounting or GST filing. The app exports data to accounting software instead.
- Panel design or shading simulation software.
- Customer-facing mobile app (a read-only status link is in scope; a full app is not).

### 4.3 Success Metrics

| Metric | Target (6 months after launch) |
|---|---|
| Projects with complete document checklist at submission | ≥ 95% |
| Panels with serial number linked to a project | 100% |
| Average days from contract to APSPDCL application | Reduce by 30% vs baseline |
| Projects with margin computed at closure | 100% |
| Weekly active internal users | ≥ 90% of staff |

Baselines must be measured during the first month.

---

## 5. Users and Roles

| Role | Description | Key needs |
|---|---|---|
| **Owner/Admin** | Company directors | Dashboard, margins, cash position, user management |
| **Sales/Business Development** | Finds leads, signs contracts | Lead pipeline, quotations, contract status |
| **Liaison/Paperwork Executive** | Handles APSPDCL, portal, and subsidy | Checklists, deadlines, document store, officer contacts |
| **Inventory/Store Manager** | Receives and issues panels | GRN, serial scanning, stock levels, allocation |
| **Site Supervisor/Project Manager** | Runs installation | Task list, crew, materials, progress photos |
| **Accounts** | Invoices and payments | Client invoices, receipts, supplier payments, export |
| **Installer/Worker** (limited) | Hired for a project | Attendance and assigned tasks only |
| **Customer** (view-only link) | Client | Status, documents, payment schedule |

Role-based access control applies. For example, workers cannot see margins, and sales cannot edit stock.

---

## 6. Scope and Functional Requirements

Priorities: **P0** = pilot must-have, **P1** = next release, **P2** = later.

### 6.1 Authentication and Access Control

- FR-1.1 (P0) Email/phone-based login with role-based access.
- FR-1.2 (P0) Admin can create, disable, and change roles of users.
- FR-1.3 (P1) Audit log of who changed what and when for key records (stock, approvals, payments).
- FR-1.4 (P1) Two-factor authentication for Admin and Accounts.

### 6.2 Customer and Lead Management

- FR-2.1 (P0) Create customer record: name, phone, address, district, DISCOM (APSPDCL/APEPDCL/APCPDCL), service/consumer number, sanctioned load, category (residential/commercial/industrial/RWA), roof ownership.
- FR-2.2 (P0) Lead status: New, Site Survey, Quoted, Negotiation, Won, Lost (with reason).
- FR-2.3 (P1) Quotation builder with system size, panel model, inverter, price, subsidy estimate, and net payable.
- FR-2.4 (P1) Follow-up reminders.

### 6.3 Project and Contract Management

- FR-3.1 (P0) A project is created when a lead is Won. It stores system size (kW), panel and inverter models, contract value, payment terms, and expected dates.
- FR-3.2 (P0) Project stages (configurable): Contract Signed, Documents Collected, Portal/APSPDCL Application Filed, Feasibility Approved, Material Allocated, Installation, Inspection, Net Meter Installed, Commissioned, Subsidy Claimed, Subsidy Received, Closed.
- FR-3.3 (P0) Each stage has an owner, start date, target date, and status (Not started, In progress, Blocked, Done). A "Blocked" status requires a reason.
- FR-3.4 (P0) Project dashboard: list and Kanban views, filters by stage, DISCOM, assignee, and delayed.
- FR-3.5 (P1) Contract upload and version history.
- FR-3.6 (P1) Timeline view with planned vs actual dates.

### 6.4 Approvals and Paperwork Workflow

This is the core differentiator. The app treats each approval as a tracked step with documents, contacts, and time limits.

- FR-4.1 (P0) **Approval templates** per project type (for example "APSPDCL Residential Net Metering + PM Surya Ghar subsidy"). A template defines the ordered steps, required documents, and expected SLA days. Admin can edit templates without code changes.
- FR-4.2 (P0) **Document checklist** per project. Examples: APSPDCL electricity bill, Aadhaar, PAN, ownership proof, roof photos, association NOC (apartments), feasibility report, commissioning certificate, net-meter certificate, self-declaration form, bank details. Each item has status (Pending, Received, Submitted, Rejected, Accepted), file upload, and remarks.
- FR-4.3 (P0) **Officer directory:** DISCOM, circle/division, section/sub-division, and officer name and designation (for example Assistant Engineer – Renewable, Assistant Engineer – Operations, Assistant Divisional Engineer), phone, and office address. Each approval step can be linked to the officer responsible.
- FR-4.4 (P0) **Approval log:** for each step record application/ARN number, submission date, follow-up dates, response, deficiency notes, and approval date.
- FR-4.5 (P0) **SLA tracking and alerts:** the app computes due dates from the template and flags overdue steps (for example a follow-up reminder if feasibility review has been pending beyond the configured window, with escalation thereafter). SLA values are configurable per DISCOM/circle, since APSPDCL, APEPDCL, and APCPDCL are reported to move at different speeds.
- FR-4.6 (P1) **Deficiency tracking:** if APSPDCL raises deficiencies, log each with a due date and resolution.
- FR-4.7 (P0) **Subsidy tracking:** eligibility flag with rule inputs (customer category, system size, panel ALMM status, empanelled-vendor status), expected subsidy amount from an editable slab table, claim date, reference number, and received date. Track whether the subsidy is customer-directed (DBT to the customer account) so that cash-flow planning reflects it correctly. Include a configurable field for any future AP state-level top-up, in case NREDCAP introduces one.
- FR-4.8 (P1) Customer financing tracker (bank loan applied, sanctioned, disbursed).
- FR-4.9 (P1) Rule warnings, for example "system size exceeds sanctioned load" or "panel model is not marked ALMM-compliant" or "mounting structure not rated for cyclone zone."
- FR-4.10 (P2) Generate pre-filled cover letters and forms from project data.

### 6.5 Supplier and Purchase Management

- FR-5.1 (P0) Supplier master: manufacturer or distributor (for example Waaree), contact, GSTIN, payment terms.
- FR-5.2 (P0) Purchase order and purchase invoice entry: invoice number, date, supplier, line items (model, wattage, quantity, unit price, GST), total, attached invoice PDF. The invoice is in the company's name.
- FR-5.3 (P1) Payment tracking against supplier invoices (due date, paid, outstanding).
- FR-5.4 (P1) Record warranty terms per product model.
- FR-5.5 (P1) Product catalogue: panels, inverters, structures (including cyclone/wind-rated mounting options for coastal/high-wind sites), cables, and other balance-of-system items, each with an ALMM flag and datasheet upload.

### 6.6 Inventory Management

- FR-6.1 (P0) **Goods receipt (GRN):** on delivery, the store manager creates a GRN linked to the purchase invoice and records quantity received, damaged, or short.
- FR-6.2 (P0) **Serial-number capture:** each panel and inverter serial number is recorded at GRN by typing, CSV upload, or barcode/QR scan (camera-based scanning on mobile is P1). Duplicate serials are rejected.
- FR-6.3 (P0) **Item status lifecycle:** In Stock → Reserved (for a project) → Issued/In Transit → Installed → (Returned / Damaged / Warranty Claim).
- FR-6.4 (P0) **Allocation:** reserve stock to a project before the crew loads out. A project cannot move to Installation without allocated material.
- FR-6.5 (P0) **Issue to site:** record which serials went to which project, date, and issued-by/received-by.
- FR-6.6 (P0) **Installed-serial record:** the supervisor confirms the serials installed at the site. These are used in the commissioning report and warranty registration.
- FR-6.7 (P0) **Stock dashboard:** on-hand, reserved, and available quantities by model and location.
- FR-6.8 (P1) Locations: warehouse, vehicle, site.
- FR-6.9 (P1) Reorder levels and low-stock alerts.
- FR-6.10 (P1) Returns, damage, and shortage handling, with claim tracking towards the supplier.
- FR-6.11 (P1) Physical stock count/audit with variance report.
- FR-6.12 (P1) Traceability search: enter a serial number to see the purchase invoice, batch, project, customer, and installation date. Enter an invoice number to see all serials from it.
- FR-6.13 (P2) Non-serialized materials (cables, structure, nuts and bolts) tracked by quantity, with consumption per project.

### 6.7 Installation and Site Execution

- FR-7.1 (P0) Task list per project (structure erection, panel mounting, inverter, wiring, earthing, testing, cleanup). Templates can be edited; include an optional cyclone/wind-load structural check step for coastal Andhra Pradesh sites.
- FR-7.2 (P0) Crew management: worker master (name, phone, skill, daily wage), assignment to projects, and attendance by date.
- FR-7.3 (P0) Progress updates by the supervisor with percentage complete, notes, and photos (before, during, after). Photos are timestamped.
- FR-7.4 (P1) Geo-tag photos where the device allows.
- FR-7.5 (P1) Safety checklist and sign-off.
- FR-7.6 (P1) Issue log (roof condition, material shortage, weather) with resolution.
- FR-7.7 (P1) Customer sign-off of completion (typed OTP or signature).
- FR-7.8 (P2) Labour cost auto-calculated from attendance and wage.

### 6.8 Finance and Margin

- FR-8.1 (P0) **Client invoices and payment schedule** per project (advance, on delivery, on commissioning, and balance). Record payments received with date, mode, and reference.
- FR-8.2 (P0) **Project cost ledger:** panel cost (from allocated serials and invoice unit price), other materials, labour, transport, approval and liaison fees, and other costs.
- FR-8.3 (P0) **Margin view:** revenue, cost, and margin (amount and percentage) per project, including "expected" (contract) and "actual".
- FR-8.4 (P1) Outstanding receivables report with aging.
- FR-8.5 (P1) Subsidy handling: the subsidy is credited to the customer, so the app must show it separately from company revenue and calculate the customer's net payable clearly.
- FR-8.6 (P1) Export to CSV/Excel and a format compatible with accounting software (for example Tally). GST-related fields are stored, and filing itself is out of scope.
- FR-8.7 (P2) Cash flow forecast.

### 6.9 Documents and Communication

- FR-9.1 (P0) Central document storage per project and customer with type tags, upload date, and uploader.
- FR-9.2 (P1) Notification via in-app, email, and WhatsApp/SMS (provider to be chosen) for due dates and status changes.
- FR-9.3 (P1) Read-only customer status link showing stage, approval progress, and payment schedule.
- FR-9.4 (P1) Comments/notes on projects with @mentions.

### 6.10 Dashboards and Reports

- FR-10.1 (P0) Owner dashboard: projects by stage, delayed projects, receivables due, stock available, and margin summary.
- FR-10.2 (P1) Approval pipeline report: applications pending by DISCOM (APSPDCL/APEPDCL/APCPDCL)/officer, average days per step.
- FR-10.3 (P1) Inventory report: stock ledger, movement history, and aging.
- FR-10.4 (P1) Profitability report by month, system size, and DISCOM.
- FR-10.5 (P1) Subsidy report: claimed vs received.

---

## 7. Key User Flows

### 7.1 Lead to contract
Sales creates a customer and lead → survey → quotation → customer accepts → lead marked Won → project auto-created with the default APSPDCL approval template.

### 7.2 Approvals and subsidy
Liaison executive collects the documents against the checklist → files the national portal application and the APSPDCL application, recording the ARN and any APSPDCL reference numbers → the system starts the SLA clock → follow-ups and deficiencies are logged → feasibility approved by the Assistant Engineer (Renewable) → after installation, the Assistant Engineer (Operations) records inspection and net meter installation → commissioning report is uploaded → subsidy claim is tracked until received.

### 7.3 Inventory
Purchase invoice entered → goods arrive → GRN with serial scan → stock In Stock → project allocation (Reserved) → issue to site (Issued) → supervisor confirms installed serials (Installed) → serial list is available for the commissioning report and warranty registration.

### 7.4 Installation
Supervisor sees the assigned project → marks attendance → updates tasks and uploads photos → raises issues → project moves to Inspection when tasks are done.

### 7.5 Payment and closure
Accounts raises client invoices at milestones → records receipts → cost ledger is completed → margin is computed → the project is closed once subsidy and final payment are recorded.

---

## 8. Data Model (High-Level)

Main entities and relationships:

- **User** (role)
- **Customer** 1—N **Project**
- **Project** N—1 **ApprovalTemplate**; 1—N **ApprovalStep**; 1—N **DocumentItem**; 1—N **Task**; 1—N **CostEntry**; 1—N **ClientInvoice** / **Payment**; 1—1 **Subsidy**
- **ApprovalStep** N—1 **Officer** (DISCOM, circle/division/section, designation)
- **Supplier** 1—N **PurchaseInvoice** 1—N **InvoiceLine**
- **GRN** N—1 **PurchaseInvoice**; 1—N **StockItem**
- **StockItem** (serial number, model, status, location, project) N—1 **Product**
- **Worker** N—N **Project** via **Attendance**
- **AuditLog**

The design should keep rules (subsidy slabs, SLA days, DISCOM list, document checklists) in configuration tables.

---

## 9. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Performance** | Pages load in under 3 s on a typical 4G mobile connection; lists are paginated. |
| **Availability** | Target 99.5% during business hours. |
| **Security** | HTTPS only, hashed passwords, role-based authorization enforced on the server, per-record access checks, secrets kept out of source control. |
| **Privacy and compliance** | The app stores Aadhaar copies, PAN, bank details, and addresses. Comply with the Digital Personal Data Protection Act, 2023: collect consent, minimize data, restrict access, and support deletion requests. Mask Aadhaar numbers where full display is not required. |
| **Files** | Documents stored in private object storage with signed URLs (never public links). Accepted types: PDF, JPG, PNG. Size limit set per file. |
| **Backups** | Daily automated database backups with restore tested at least quarterly. |
| **Usability** | Mobile-first for supervisors and store staff. Simple English UI, with Telugu labels as a P2 option. |
| **Offline tolerance** | (P2) Site supervisors can queue photos and progress updates when connectivity is poor (relevant for rural Rayalaseema sites in APSPDCL territory). |
| **Auditability** | Stock and payment changes are append-only with reasons, so history is not overwritten. |
| **Maintainability** | Automated tests for stock and margin calculations. Environment separation between staging and production. |

---

## 10. Suggested Technical Approach

The pilot is already on Vercel, so the following builds on that and can be changed by the development team.

- **Frontend/hosting:** Next.js (React) on Vercel.
- **Database:** managed PostgreSQL (for example Neon, Supabase, or Vercel-integrated Postgres) with an ORM such as Prisma or Drizzle. A relational database suits stock, serials, and financial records.
- **Auth:** Auth.js, Supabase Auth, or Clerk, with role claims.
- **File storage:** S3-compatible private storage (Supabase Storage, Cloudflare R2, or Vercel Blob with private access).
- **Background jobs:** scheduled jobs for SLA checks and reminders (Vercel Cron or a job queue).
- **Notifications:** email provider plus a WhatsApp Business API provider (P1).
- **Barcode scanning:** browser-based scanning library on mobile (P1).
- **Observability:** error tracking (for example Sentry) and basic analytics.

Open question: whether the existing pilot code should be extended or rebuilt (see Section 14).

---

## 11. Release Plan

| Phase | Scope | Outcome |
|---|---|---|
| **Phase 0: Discovery (1-2 weeks)** | Review the pilot, interview each role, collect real documents (invoices, checklists, forms), confirm current APSPDCL/NREDCAP/APERC rules directly with those bodies, decide on data migration | Signed-off scope and baselines |
| **Phase 1: MVP (6-8 weeks)** | Auth and roles, customers/projects, stages, approval templates and document checklist, purchase invoices, GRN with serials, allocation and issue, basic margin view, owner dashboard | Company runs all new projects on the app |
| **Phase 2 (6-8 weeks)** | SLA alerts, notifications, deficiency tracking, subsidy tracking detail, site tasks/attendance/photos, client invoices and receivables, reports and exports | Approvals and site work fully tracked |
| **Phase 3 (later)** | Barcode scanning, customer status link, quotations, financing tracker, offline support, Telugu UI, accounting integration, multi-DISCOM support (APEPDCL/APCPDCL) | Efficiency and customer experience |

Timelines are estimates for a small team and must be re-estimated after Phase 0.

---

## 12. Acceptance Criteria (Pilot to MVP)

- A user can create a project and see the full approval checklist generated from an APSPDCL template.
- A GRN can be created against a purchase invoice with unique serial numbers, and duplicate serials are rejected.
- A serial can be traced to its invoice, project, and customer in under 10 seconds.
- A project cannot be moved to Installation unless material is allocated.
- Overdue approval steps are flagged on the dashboard.
- Margin per project matches a manual calculation on 5 sample projects.
- Role restrictions are verified: workers cannot see finance, and sales cannot edit stock.

---

## 13. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Government scheme rules, DISCOM boundaries, or subsidy slabs change | Wrong subsidy shown, rejected claims | Keep rules in editable configuration, show "last verified" date, review monthly with APSPDCL/NREDCAP |
| Conflicting third-party info on AP DISCOM structure (this document found inconsistent naming) | Wrong officer/checklist assigned to a project | Verify DISCOM/circle/division list directly with APSPDCL before go-live; treat this document's DISCOM list as provisional |
| Non-ALMM or non-compliant panels installed | Inspection failure, subsidy lost | ALMM flag on products, warning at allocation, block option for subsidy projects |
| Cyclone/wind-load non-compliance on coastal or exposed sites | Structural failure, rework, inspection failure | Structural checklist item, IS 875 Part 3 rating flag on mounting products |
| Sensitive personal data leakage (Aadhaar, PAN, bank) | Legal and reputational harm | Private storage, access control, masking, audit logs, DPDP compliance |
| Low adoption by staff | System goes stale | Mobile-first design, training, owner review of dashboards weekly |
| Poor connectivity at rural sites | Missing updates | Photo upload retry now, offline mode later |
| Serial entry is slow | Staff skip it | CSV upload and barcode scanning, and check whether manufacturer packing lists can be imported |
| Data loss | Business disruption | Automated backups and tested restores |
| Scope creep into full ERP | Delays | Enforce the non-goals list and phase plan |

---

## 14. Open Questions

1. What is the exact subsidy path used in practice: does the customer receive DBT directly, and does SunPowerGenesys collect the full price from the customer and let them claim the subsidy afterwards?
2. Is SunPowerGenesys NREDCAP-empanelled and registered on the national portal as a vendor, and do any projects also cover commercial or industrial customers?
3. Which APSPDCL circles/divisions/sections does the company operate in today, and does it also work in APEPDCL or APCPDCL territory?
4. What is the current official APSPDCL feasibility/inspection timeline and officer designation structure — this should be confirmed directly with APSPDCL or NREDCAP rather than relied on from third-party guides, since sources in this research disagreed on the number of AP DISCOMs and on stage timelines.
5. How many projects, staff, and panels per month are expected in the first year?
6. Are installation workers employed directly, or hired through contractors or per project (affects payroll, insurance, and safety records)?
7. Should the app produce GST-compliant client invoices, or only record invoices raised in the accounting software?
8. What does the current pilot on Vercel contain (framework, database, users), and can it be kept?
9. Are other manufacturers besides Waaree used, and do they provide serial lists electronically?
10. Do customers need a login or is a status link enough?
11. Which language(s) should the UI support (English only, or also Telugu)?
12. Does Andhra Pradesh currently offer any state-level subsidy top-up beyond the central PM Surya Ghar amount, and is this likely to change?

---

## 15. Glossary

| Term | Meaning |
|---|---|
| **ALMM** | Approved List of Models and Manufacturers: MNRE list of approved solar modules (and, from a set date, cells) |
| **APCPDCL** | Central Power Distribution Company of Andhra Pradesh Limited |
| **APEPDCL** | Eastern Power Distribution Company of Andhra Pradesh Limited |
| **APERC** | Andhra Pradesh Electricity Regulatory Commission |
| **APPC** | Average Pooled Power Purchase Cost: reference rate used in surplus/export settlement |
| **APSPDCL** | Southern Power Distribution Company of Andhra Pradesh Limited — the DISCOM responsible for this company's primary market |
| **ARN** | Application Reference Number, generated on the National Portal for Rooftop Solar |
| **DBT** | Direct Benefit Transfer |
| **DISCOM** | Electricity distribution company |
| **GRN** | Goods Receipt Note |
| **kW** | Kilowatt: system capacity |
| **MNRE** | Ministry of New and Renewable Energy |
| **Net metering** | Billing arrangement using a bidirectional meter that offsets exported against imported energy; AP uses annual banking with year-end settlement of surplus units |
| **NREDCAP** | New and Renewable Energy Development Corporation of Andhra Pradesh Ltd. — the state nodal agency for vendor empanelment and scheme coordination |
| **PM Surya Ghar** | PM Surya Ghar: Muft Bijli Yojana, central rooftop solar subsidy scheme |

---

## 16. Sources Consulted

Third-party guides read in September 2026, used only for background on the industry workflow. **Note:** sources disagreed on the exact number and naming of Andhra Pradesh DISCOMs (some described two, others three), and the official APSPDCL page itself did not publish step-by-step timelines. This is flagged in Sections 2.2, 13, and 14 — verify directly with APSPDCL, NREDCAP, and APERC before implementation.

- APSPDCL official site, Solar Applications page: https://www.apspdcl.in/solar-applications.php
- APSPDCL official site (home): https://www.apspdcl.in/
- Heaven Green Energy, PM Suryaghar APSPDCL process: https://www.heavengreenenergy.com/blog/pm-suryaghar-apspdcl-process
- Qbits, Solar subsidy in Andhra Pradesh (APEPDCL/APNPDCL naming — unverified against official source): https://qbitsenergy.com/blog/solar-subsidy-andhra-pradesh-2026/
- SurgePV, Andhra Pradesh solar policy and APERC regulations: https://www.surgepv.com/solar-compliance/india/andhra-pradesh
- SriSparks, Solar subsidy in Andhra Pradesh: https://www.srisparks.in/solar-subsidy-andhra-pradesh/
- ELRIX Energy, PM Surya Ghar Andhra Pradesh guide: https://elrixenergy.com/blog/pm-surya-ghar-andhra-pradesh-complete-guide
- PM Solar, Andhra Pradesh subsidy page: https://pmsolar.org.in/en/state/andhra-pradesh/
- NREDCAP, Andhra Pradesh Solar Power Policy 2018 (official PDF): https://nredcap.in/PDFs/Pages/AP_Solar_Power_Policy_2018.pdf
- NREDCAP, Solar Power Policy (official PDF): https://nredcap.in/pdfs/pages/solar_power_policy.pdf
- Greenon Energy, Net metering in Andhra Pradesh: https://greenonenergy.in/net-metering-andhra-pradesh/
- Andhra Pradesh Electricity Regulatory Commission order on Net-Gross Metering Regulation 2023 (official PDF via Simpliance): https://www.simpliance.in/download/file/dXBsb2Fkcy9nb3Z0bm90aWZpY2F0aW9uL09yZGVyIHJlZ3JhZGluZyBHcmlkIEludGVyYWN0aXZlIFNvbGFyIFJvb2Z0b3AgUGhvdG92b2x0YWljIFN5c3RlbXMgdW5kZXIgTmV0R3Jvc3MgTWV0ZXJpbmcgUmVndWxhdGlvbiwgMjAyMyBpbiB0aGUgc3RhdGUgb2YgQW5kaHJhIFByYXNlc2gucGRm
- APSPDCL Tariff, Districts and Bill Payment Guide (third-party): https://www.apelectricitybillcalculator.in/discoms/apspdcl
- APCPDCL Tariff, Districts and Bill Payment Guide (third-party): https://www.apelectricitybillcalculator.in/discoms/apcpdcl
- Wikipedia: Pradhan Mantri Surya Ghar Muft Bijli Yojana (national scheme background): https://en.wikipedia.org/wiki/Pradhan_Mantri_Surya_Ghar_Muft_Bijli_Yojana
- Finale Inventory, serial number tracking (industry-wide inventory practice): https://www.finaleinventory.com/serial-number-tracking
- ECOSIRE, ERP for solar energy companies (industry-wide inventory practice): https://ecosire.com/blog/erp-for-solar-energy
- inFlow, inventory management for solar installers (industry-wide inventory practice): https://www.inflowinventory.com/use-cases/inventory-management-for-solar-installers
