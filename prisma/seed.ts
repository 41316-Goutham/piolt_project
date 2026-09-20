import { PrismaClient, Discom, LeadStatus, CustomerCategory, ProductCategory, StockItemStatus, StageStatus, ApprovalStepStatus, DocumentStatus, PaymentMilestoneType, InvoiceStatus, PaymentMode, CostCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  console.log("Seeding database...");

  // --- Wipe in FK-safe order ---
  await prisma.payment.deleteMany();
  await prisma.clientInvoice.deleteMany();
  await prisma.costEntry.deleteMany();
  await prisma.subsidy.deleteMany();
  await prisma.documentItem.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.approvalTemplateStep.deleteMany();
  await prisma.approvalTemplate.deleteMany();
  await prisma.projectStage.deleteMany();
  await prisma.stageTemplateStep.deleteMany();
  await prisma.stageTemplate.deleteMany();
  await prisma.stockConsumption.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.gRNLine.deleteMany();
  await prisma.gRN.deleteMany();
  await prisma.purchaseInvoiceLine.deleteMany();
  await prisma.purchaseInvoice.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.officer.deleteMany();
  await prisma.subsidySlab.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.project.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // --- Users (one per role) ---
  const roleUsers: Record<string, { email: string; name: string; password: string }> = {
    ADMIN: { email: "admin@sunpowergenesys.com", name: "Priya Sharma", password: "Admin@123" },
    SALES: { email: "sales@sunpowergenesys.com", name: "Arjun Reddy", password: "Sales@123" },
    LIAISON: { email: "liaison@sunpowergenesys.com", name: "Kavya Chowdary", password: "Liaison@123" },
    INVENTORY_MANAGER: { email: "inventory@sunpowergenesys.com", name: "Ramesh Naik", password: "Inventory@123" },
    SITE_SUPERVISOR: { email: "supervisor@sunpowergenesys.com", name: "Suresh Babu", password: "Supervisor@123" },
    ACCOUNTS: { email: "accounts@sunpowergenesys.com", name: "Divya Prasad", password: "Accounts@123" },
    WORKER: { email: "worker@sunpowergenesys.com", name: "Ganesh Kumar", password: "Worker@123" },
  };

  const users: Record<string, { id: string }> = {};
  for (const [role, info] of Object.entries(roleUsers)) {
    const passwordHash = await bcrypt.hash(info.password, 10);
    users[role] = await prisma.user.create({
      data: { name: info.name, email: info.email, passwordHash, role: role as never },
    });
  }

  const customerPasswordHash = await bcrypt.hash("Customer@123", 10);

  // --- Suppliers ---
  const waaree = await prisma.supplier.create({
    data: {
      name: "Waaree Energies Ltd",
      contactEmail: "partners@waaree.com",
      contactPhone: "+91 22 6644 5566",
      gstin: "27AAJCW1234B1Z5",
      paymentTerms: "Net 30",
    },
  });

  const adani = await prisma.supplier.create({
    data: {
      name: "Adani Solar",
      contactEmail: "channel@adanisolar.com",
      gstin: "24AABCA5678C1Z2",
      paymentTerms: "Net 45",
    },
  });

  // --- Products ---
  const waareePanel = await prisma.product.create({
    data: {
      name: "Waaree 550W Mono PERC Panel",
      sku: "WAR-PNL-550",
      category: ProductCategory.PANEL,
      supplierId: waaree.id,
      spec: "550Wp, Mono PERC, ALMM listed",
      unit: "pcs",
      unitPriceDefault: 12500,
      isAlmmCompliant: true,
      reorderLevel: 20,
    },
  });

  const waareeInverter = await prisma.product.create({
    data: {
      name: "Waaree 5kW String Inverter",
      sku: "WAR-INV-5K",
      category: ProductCategory.INVERTER,
      supplierId: waaree.id,
      spec: "5kW, BIS certified",
      unit: "pcs",
      unitPriceDefault: 45000,
      isAlmmCompliant: true,
      reorderLevel: 5,
    },
  });

  // Intentionally NOT ALMM-compliant, to demonstrate the rule-warning banner.
  const adaniPanel = await prisma.product.create({
    data: {
      name: "Adani 400W Mono Panel",
      sku: "ADN-PNL-400",
      category: ProductCategory.PANEL,
      supplierId: adani.id,
      spec: "400Wp, Mono — ALMM listing lapsed, pending renewal",
      unit: "pcs",
      unitPriceDefault: 9800,
      isAlmmCompliant: false,
      reorderLevel: 20,
    },
  });

  const structure = await prisma.product.create({
    data: {
      name: "Cyclone-Rated Mounting Structure (per kW)",
      sku: "GEN-STR-1KW-CYC",
      category: ProductCategory.STRUCTURE,
      supplierId: waaree.id,
      spec: "IS 875 Part 3 wind-load rated",
      unit: "sets",
      unitPriceDefault: 4800,
      isAlmmCompliant: false,
      reorderLevel: 20,
      quantityInStock: 60,
    },
  });

  const cable = await prisma.product.create({
    data: {
      name: "4 sq mm DC Solar Cable (100m roll)",
      sku: "GEN-CBL-DC4",
      category: ProductCategory.CABLE,
      supplierId: waaree.id,
      unit: "rolls",
      unitPriceDefault: 6200,
      isAlmmCompliant: false,
      reorderLevel: 10,
      quantityInStock: 18,
    },
  });

  // --- Purchase invoices + GRNs + serialized stock ---
  const waareeInvoice = await prisma.purchaseInvoice.create({
    data: {
      invoiceNumber: "WAR-INV-2026-0142",
      supplierId: waaree.id,
      invoiceDate: daysAgo(45),
      totalAmount: 50 * 12500 + 5 * 45000,
      gstAmount: (50 * 12500 + 5 * 45000) * 0.18,
      lines: {
        create: [
          { productId: waareePanel.id, quantity: 50, unitPrice: 12500, gstRate: 18, lineTotal: 50 * 12500 },
          { productId: waareeInverter.id, quantity: 5, unitPrice: 45000, gstRate: 18, lineTotal: 5 * 45000 },
        ],
      },
    },
    include: { lines: true },
  });

  const waareeGrn = await prisma.gRN.create({
    data: {
      purchaseInvoiceId: waareeInvoice.id,
      receivedDate: daysAgo(43),
      receivedById: users.INVENTORY_MANAGER.id,
      notes: "Full delivery, no damage.",
      lines: {
        create: [
          { purchaseInvoiceLineId: waareeInvoice.lines[0].id, productId: waareePanel.id, qtyReceived: 50 },
          { purchaseInvoiceLineId: waareeInvoice.lines[1].id, productId: waareeInverter.id, qtyReceived: 5 },
        ],
      },
    },
    include: { lines: true },
  });

  const adaniInvoice = await prisma.purchaseInvoice.create({
    data: {
      invoiceNumber: "ADN-INV-2026-0088",
      supplierId: adani.id,
      invoiceDate: daysAgo(30),
      totalAmount: 30 * 9800,
      gstAmount: 30 * 9800 * 0.18,
      lines: {
        create: [{ productId: adaniPanel.id, quantity: 30, unitPrice: 9800, gstRate: 18, lineTotal: 30 * 9800 }],
      },
    },
    include: { lines: true },
  });

  const adaniGrn = await prisma.gRN.create({
    data: {
      purchaseInvoiceId: adaniInvoice.id,
      receivedDate: daysAgo(28),
      receivedById: users.INVENTORY_MANAGER.id,
      lines: {
        create: [{ purchaseInvoiceLineId: adaniInvoice.lines[0].id, productId: adaniPanel.id, qtyReceived: 30 }],
      },
    },
    include: { lines: true },
  });

  async function createSerials(
    product: { id: string; unitPriceDefault: number | null },
    grnLineId: string,
    prefix: string,
    count: number,
    startIndex: number
  ) {
    const items = [];
    for (let i = 0; i < count; i++) {
      const serialNumber = `${prefix}-${String(startIndex + i).padStart(5, "0")}`;
      items.push({
        serialNumber,
        productId: product.id,
        grnLineId,
        unitCost: product.unitPriceDefault ?? 0,
        status: StockItemStatus.IN_STOCK,
      });
    }
    await prisma.stockItem.createMany({ data: items });
    return prisma.stockItem.findMany({ where: { serialNumber: { in: items.map((i) => i.serialNumber) } } });
  }

  const waareePanelSerials = await createSerials(waareePanel, waareeGrn.lines[0].id, "WR550", 50, 1);
  const waareeInverterSerials = await createSerials(waareeInverter, waareeGrn.lines[1].id, "WRINV5K", 5, 1);
  const adaniPanelSerials = await createSerials(adaniPanel, adaniGrn.lines[0].id, "ADN400", 30, 1);

  // --- Officers ---
  const officerFeasibilityTirupati = await prisma.officer.create({
    data: {
      discom: Discom.APSPDCL,
      circle: "Tirupati Circle",
      division: "Tirupati Division",
      section: "Tirupati Section-2",
      name: "K. Ramesh Babu",
      designation: "Assistant Engineer (Renewable)",
      phone: "+91 94400 11223",
    },
  });

  const officerOperationsTirupati = await prisma.officer.create({
    data: {
      discom: Discom.APSPDCL,
      circle: "Tirupati Circle",
      division: "Tirupati Division",
      section: "Tirupati Section-2",
      name: "P. Lakshmi Devi",
      designation: "Assistant Engineer (Operations)",
      phone: "+91 94400 33445",
    },
  });

  const officerNellore = await prisma.officer.create({
    data: {
      discom: Discom.APSPDCL,
      circle: "Nellore Circle",
      division: "Nellore Division",
      name: "S. Venkata Rao",
      designation: "Assistant Divisional Engineer",
      phone: "+91 94400 55667",
    },
  });

  const officerKurnool = await prisma.officer.create({
    data: {
      discom: Discom.APSPDCL,
      circle: "Kurnool Circle",
      division: "Kurnool Division",
      section: "Kurnool Section-1",
      name: "M. Chandra Sekhar",
      designation: "Assistant Engineer (Renewable)",
      phone: "+91 94400 77889",
    },
  });

  const officerAnantapur = await prisma.officer.create({
    data: {
      discom: Discom.APSPDCL,
      circle: "Anantapur Circle",
      division: "Anantapur Division",
      name: "T. Suryanarayana",
      designation: "Assistant Engineer (Operations)",
      phone: "+91 94400 99001",
    },
  });

  // --- Subsidy slabs (PM Surya Ghar, editable config) ---
  const slab1 = await prisma.subsidySlab.create({
    data: { minKw: 0, maxKw: 1, amount: 30000, label: "Up to 1 kW", isActive: true },
  });
  const slab2 = await prisma.subsidySlab.create({
    data: { minKw: 1, maxKw: 2, amount: 60000, label: "Above 1 kW up to 2 kW", isActive: true },
  });
  const slab3 = await prisma.subsidySlab.create({
    data: { minKw: 2, maxKw: null, amount: 78000, label: "Above 2 kW (capped — no additional subsidy above 3 kW)", isActive: true },
  });

  function slabFor(kw: number) {
    if (kw <= 1) return slab1;
    if (kw <= 2) return slab2;
    return slab3;
  }

  // --- Stage template (APSPDCL residential) ---
  const stageTemplate = await prisma.stageTemplate.create({
    data: { name: "APSPDCL Residential Net Metering + PM Surya Ghar", discom: Discom.APSPDCL },
  });

  const stageDefs = [
    { order: 1, stepName: "Contract Signed", defaultSlaDays: 2, requiresAllocation: false },
    { order: 2, stepName: "Documents Collected", defaultSlaDays: 5, requiresAllocation: false },
    { order: 3, stepName: "Portal / APSPDCL Application Filed", defaultSlaDays: 3, requiresAllocation: false },
    { order: 4, stepName: "Feasibility Approved", defaultSlaDays: 15, requiresAllocation: false },
    { order: 5, stepName: "Material Allocated", defaultSlaDays: 5, requiresAllocation: false },
    { order: 6, stepName: "Installation", defaultSlaDays: 10, requiresAllocation: true },
    { order: 7, stepName: "Inspection", defaultSlaDays: 7, requiresAllocation: false },
    { order: 8, stepName: "Net Meter Installed", defaultSlaDays: 5, requiresAllocation: false },
    { order: 9, stepName: "Commissioned", defaultSlaDays: 2, requiresAllocation: false },
    { order: 10, stepName: "Subsidy Claimed", defaultSlaDays: 5, requiresAllocation: false },
    { order: 11, stepName: "Subsidy Received", defaultSlaDays: 30, requiresAllocation: false },
    { order: 12, stepName: "Closed", defaultSlaDays: 2, requiresAllocation: false },
  ];

  const stageTemplateSteps: Awaited<ReturnType<typeof prisma.stageTemplateStep.create>>[] = [];
  for (const s of stageDefs) {
    stageTemplateSteps.push(
      await prisma.stageTemplateStep.create({ data: { templateId: stageTemplate.id, ...s } })
    );
  }

  // --- Approval template (APSPDCL residential) ---
  const approvalTemplate = await prisma.approvalTemplate.create({
    data: { name: "APSPDCL Residential Net Metering + PM Surya Ghar", discom: Discom.APSPDCL },
  });

  const approvalDefs = [
    {
      order: 1,
      stepName: "National Portal Registration",
      slaDays: 3,
      requiredDocumentTypes: ["Electricity Bill", "Aadhaar", "PAN", "Bank Proof"],
    },
    {
      order: 2,
      stepName: "APSPDCL Feasibility Review",
      slaDays: 15,
      requiredDocumentTypes: ["Ownership Proof", "Roof Photos"],
    },
    {
      order: 3,
      stepName: "Vendor Installation & ALMM Compliance",
      slaDays: 10,
      requiredDocumentTypes: ["Self-Declaration Form"],
    },
    {
      order: 4,
      stepName: "Net Meter Inspection",
      slaDays: 7,
      requiredDocumentTypes: ["Inspection Report"],
    },
    {
      order: 5,
      stepName: "Commissioning Report Upload",
      slaDays: 3,
      requiredDocumentTypes: ["Commissioning Certificate"],
    },
    {
      order: 6,
      stepName: "Subsidy Disbursement",
      slaDays: 30,
      requiredDocumentTypes: ["Subsidy Claim Form"],
    },
  ];

  const approvalTemplateSteps: Awaited<ReturnType<typeof prisma.approvalTemplateStep.create>>[] = [];
  for (const a of approvalDefs) {
    approvalTemplateSteps.push(
      await prisma.approvalTemplateStep.create({ data: { templateId: approvalTemplate.id, ...a } })
    );
  }

  // --- Helper to instantiate stages + approval steps for a new project ---
  async function instantiateWorkflow(projectId: string, ownerId: string) {
    for (const step of stageTemplateSteps) {
      await prisma.projectStage.create({
        data: {
          projectId,
          stageTemplateStepId: step.id,
          name: step.stepName,
          order: step.order,
          requiresAllocation: step.requiresAllocation,
          ownerId,
          status: StageStatus.NOT_STARTED,
        },
      });
    }
    for (const step of approvalTemplateSteps) {
      await prisma.approvalStep.create({
        data: {
          projectId,
          approvalTemplateStepId: step.id,
          name: step.stepName,
          order: step.order,
          slaDays: step.slaDays,
          status: ApprovalStepStatus.NOT_STARTED,
        },
      });
    }
  }

  async function setStage(projectId: string, order: number, data: Parameters<typeof prisma.projectStage.updateMany>[0]["data"]) {
    await prisma.projectStage.updateMany({ where: { projectId, order }, data });
  }

  async function setApproval(
    projectId: string,
    order: number,
    data: Parameters<typeof prisma.approvalStep.updateMany>[0]["data"]
  ) {
    await prisma.approvalStep.updateMany({ where: { projectId, order }, data });
  }

  // --- Customers ---
  const customerRavi = await prisma.customer.create({
    data: {
      name: "Ravi Kumar",
      phone: "+91 90000 11111",
      address: "12 Renigunta Road, Tirupati",
      district: "Tirupati",
      discom: Discom.APSPDCL,
      serviceNumber: "TPT-0234567",
      consumerNumber: "APS-9988771",
      sanctionedLoadKw: 4, // intentionally less than the 5kW system, to demo the oversize-warning
      category: CustomerCategory.RESIDENTIAL,
      roofOwnership: "Owned",
      userId: (await prisma.user.create({
        data: { name: "Ravi Kumar", email: "ravi.kumar@example.com", passwordHash: customerPasswordHash, role: "CUSTOMER" },
      })).id,
    },
  });

  const customerLakshmi = await prisma.customer.create({
    data: {
      name: "Lakshmi Reddy",
      phone: "+91 90000 22222",
      address: "45 Grand Trunk Road, Nellore",
      district: "Nellore",
      discom: Discom.APSPDCL,
      serviceNumber: "NLR-0345678",
      consumerNumber: "APS-8877662",
      sanctionedLoadKw: 3,
      category: CustomerCategory.RESIDENTIAL,
      roofOwnership: "Owned",
      userId: (await prisma.user.create({
        data: { name: "Lakshmi Reddy", email: "lakshmi.reddy@example.com", passwordHash: customerPasswordHash, role: "CUSTOMER" },
      })).id,
    },
  });

  // Commercial customer — deliberately given NO portal login, to demonstrate
  // that a Customer can exist without one (PRD: Customer.userId is optional).
  const customerVenkatesh = await prisma.customer.create({
    data: {
      name: "Venkatesh Rao",
      phone: "+91 90000 33333",
      address: "Industrial Estate, Kurnool",
      district: "Kurnool",
      discom: Discom.APSPDCL,
      serviceNumber: "KNL-0456789",
      consumerNumber: "APS-7766553",
      sanctionedLoadKw: 8,
      category: CustomerCategory.COMMERCIAL,
      roofOwnership: "Owned",
    },
  });

  const customerKrishna = await prisma.customer.create({
    data: {
      name: "Krishna Murthy",
      phone: "+91 90000 44444",
      address: "7 Anantapuram Main Road, Anantapur",
      district: "Anantapur",
      discom: Discom.APSPDCL,
      serviceNumber: "ATP-0567890",
      consumerNumber: "APS-6655443",
      sanctionedLoadKw: 3,
      category: CustomerCategory.RESIDENTIAL,
      roofOwnership: "Owned",
      userId: (await prisma.user.create({
        data: { name: "Krishna Murthy", email: "krishna.murthy@example.com", passwordHash: customerPasswordHash, role: "CUSTOMER" },
      })).id,
    },
  });

  const customerPadma = await prisma.customer.create({
    data: {
      name: "Padma Naidu",
      phone: "+91 90000 55555",
      district: "Chittoor",
      discom: Discom.APSPDCL,
      category: CustomerCategory.RESIDENTIAL,
    },
  });

  const customerMohan = await prisma.customer.create({
    data: {
      name: "Mohan Das",
      phone: "+91 90000 66666",
      district: "Tirupati",
      discom: Discom.APSPDCL,
      category: CustomerCategory.RESIDENTIAL,
    },
  });

  // --- Leads ---
  await prisma.lead.create({
    data: {
      customerId: customerPadma.id,
      status: LeadStatus.SITE_SURVEY,
      source: "Referral",
      assignedToId: users.SALES.id,
      notes: "Survey scheduled next week.",
    },
  });

  await prisma.lead.create({
    data: {
      customerId: customerMohan.id,
      status: LeadStatus.LOST,
      source: "Website",
      assignedToId: users.SALES.id,
      lostReason: "Went with a cheaper local vendor.",
    },
  });

  // --- Project 1: Ravi Kumar — mid-progress, oversize warning, overdue approval step ---
  const project1 = await prisma.project.create({
    data: {
      title: "Rooftop Solar — Kumar Residence",
      customerId: customerRavi.id,
      systemSizeKw: 5,
      contractValue: 350000,
      paymentTermsNotes: "50% advance, 50% on commissioning.",
      startDate: daysAgo(40),
      expectedCompletionDate: daysFromNow(20),
    },
  });
  await prisma.lead.create({
    data: {
      customerId: customerRavi.id,
      status: LeadStatus.WON,
      assignedToId: users.SALES.id,
      convertedAt: daysAgo(42),
      projectId: project1.id,
    },
  });
  await instantiateWorkflow(project1.id, users.LIAISON.id);

  await setStage(project1.id, 1, { status: StageStatus.DONE, startDate: daysAgo(40), completedDate: daysAgo(40) });
  await setStage(project1.id, 2, { status: StageStatus.DONE, startDate: daysAgo(39), completedDate: daysAgo(35) });
  await setStage(project1.id, 3, { status: StageStatus.DONE, startDate: daysAgo(34), completedDate: daysAgo(33) });
  await setStage(project1.id, 4, { status: StageStatus.DONE, startDate: daysAgo(32), completedDate: daysAgo(20) });
  await setStage(project1.id, 5, { status: StageStatus.DONE, startDate: daysAgo(19), completedDate: daysAgo(15) });
  await setStage(project1.id, 6, { status: StageStatus.IN_PROGRESS, startDate: daysAgo(14), targetDate: daysFromNow(5) });

  await setApproval(project1.id, 1, {
    status: ApprovalStepStatus.APPROVED,
    officerId: null,
    arnNumber: "ARN-AP-2026-004411",
    submissionDate: daysAgo(38),
    approvalDate: daysAgo(36),
    dueDate: daysAgo(35),
  });
  await setApproval(project1.id, 2, {
    status: ApprovalStepStatus.APPROVED,
    officerId: officerFeasibilityTirupati.id,
    submissionDate: daysAgo(34),
    approvalDate: daysAgo(20),
    dueDate: daysAgo(19),
  });
  // Intentionally overdue: submitted long enough ago that slaDays (10) has passed, still not approved.
  await setApproval(project1.id, 3, {
    status: ApprovalStepStatus.QUERY_RAISED,
    officerId: officerOperationsTirupati.id,
    submissionDate: daysAgo(18),
    dueDate: daysAgo(8),
    deficiencyNotes: "Self-declaration form missing signature — resubmission requested.",
  });

  await prisma.documentItem.createMany({
    data: [
      { projectId: project1.id, type: "Electricity Bill", status: DocumentStatus.ACCEPTED, uploadedAt: daysAgo(38) },
      { projectId: project1.id, type: "Aadhaar", status: DocumentStatus.ACCEPTED, uploadedAt: daysAgo(38) },
      { projectId: project1.id, type: "PAN", status: DocumentStatus.ACCEPTED, uploadedAt: daysAgo(38) },
      { projectId: project1.id, type: "Ownership Proof", status: DocumentStatus.SUBMITTED, uploadedAt: daysAgo(34) },
      { projectId: project1.id, type: "Roof Photos", status: DocumentStatus.ACCEPTED, uploadedAt: daysAgo(34) },
      { projectId: project1.id, type: "Bank Proof", status: DocumentStatus.PENDING },
    ],
  });

  await prisma.subsidy.create({
    data: {
      projectId: project1.id,
      isEligible: true,
      expectedAmount: slabFor(5).amount,
      slabId: slabFor(5).id,
      isDbtToCustomer: true,
    },
  });

  await prisma.costEntry.createMany({
    data: [
      { projectId: project1.id, category: CostCategory.LABOUR, amount: 25000, description: "Installation crew, 4 days", date: daysAgo(12), enteredById: users.ACCOUNTS.id },
      { projectId: project1.id, category: CostCategory.TRANSPORT, amount: 5000, description: "Material transport to site", date: daysAgo(15), enteredById: users.ACCOUNTS.id },
      { projectId: project1.id, category: CostCategory.LIAISON, amount: 3000, description: "Section office liaison charges", date: daysAgo(30), enteredById: users.LIAISON.id },
    ],
  });

  const inv1a = await prisma.clientInvoice.create({
    data: {
      invoiceNumber: "SPG-2026-0001",
      projectId: project1.id,
      milestoneType: PaymentMilestoneType.ADVANCE,
      amount: 175000,
      status: InvoiceStatus.PAID,
      issueDate: daysAgo(41),
      dueDate: daysAgo(35),
    },
  });
  await prisma.payment.create({
    data: { clientInvoiceId: inv1a.id, amount: 175000, date: daysAgo(38), mode: PaymentMode.BANK_TRANSFER, referenceNumber: "UTR20260 811001", recordedById: users.ACCOUNTS.id },
  });
  await prisma.clientInvoice.create({
    data: {
      invoiceNumber: "SPG-2026-0002",
      projectId: project1.id,
      milestoneType: PaymentMilestoneType.BALANCE,
      amount: 175000,
      status: InvoiceStatus.SENT,
      issueDate: daysAgo(5),
      dueDate: daysFromNow(10),
    },
  });

  // Allocate/issue/install Waaree stock against project 1.
  const p1PanelSerials = waareePanelSerials.slice(0, 10);
  const p1InverterSerial = waareeInverterSerials[0];
  await prisma.stockItem.updateMany({
    where: { id: { in: p1PanelSerials.slice(0, 6).map((s) => s.id) } },
    data: { status: StockItemStatus.INSTALLED, projectId: project1.id, reservedAt: daysAgo(19), issuedAt: daysAgo(15), issuedById: users.INVENTORY_MANAGER.id, installedAt: daysAgo(10), installedConfirmedById: users.SITE_SUPERVISOR.id },
  });
  await prisma.stockItem.updateMany({
    where: { id: { in: p1PanelSerials.slice(6, 10).map((s) => s.id) } },
    data: { status: StockItemStatus.ISSUED, projectId: project1.id, reservedAt: daysAgo(19), issuedAt: daysAgo(15), issuedById: users.INVENTORY_MANAGER.id },
  });
  await prisma.stockItem.update({
    where: { id: p1InverterSerial.id },
    data: { status: StockItemStatus.INSTALLED, projectId: project1.id, reservedAt: daysAgo(19), issuedAt: daysAgo(15), issuedById: users.INVENTORY_MANAGER.id, installedAt: daysAgo(10), installedConfirmedById: users.SITE_SUPERVISOR.id },
  });
  await prisma.stockConsumption.create({
    data: { productId: structure.id, projectId: project1.id, quantity: 5, unitCost: structure.unitPriceDefault ?? 0, consumptionDate: daysAgo(15), recordedById: users.INVENTORY_MANAGER.id },
  });

  // --- Project 2: Lakshmi Reddy — early stage, nothing overdue, no allocation yet ---
  const project2 = await prisma.project.create({
    data: {
      title: "Rooftop Solar — Reddy Residence",
      customerId: customerLakshmi.id,
      systemSizeKw: 3,
      contractValue: 215000,
      paymentTermsNotes: "50% advance, 50% on commissioning.",
      startDate: daysAgo(10),
      expectedCompletionDate: daysFromNow(60),
    },
  });
  await prisma.lead.create({
    data: {
      customerId: customerLakshmi.id,
      status: LeadStatus.WON,
      assignedToId: users.SALES.id,
      convertedAt: daysAgo(12),
      projectId: project2.id,
    },
  });
  await instantiateWorkflow(project2.id, users.LIAISON.id);

  await setStage(project2.id, 1, { status: StageStatus.DONE, startDate: daysAgo(10), completedDate: daysAgo(10) });
  await setStage(project2.id, 2, { status: StageStatus.DONE, startDate: daysAgo(9), completedDate: daysAgo(6) });
  await setStage(project2.id, 3, { status: StageStatus.IN_PROGRESS, startDate: daysAgo(5), targetDate: daysFromNow(3) });

  await setApproval(project2.id, 1, {
    status: ApprovalStepStatus.APPROVED,
    arnNumber: "ARN-AP-2026-005522",
    submissionDate: daysAgo(9),
    approvalDate: daysAgo(6),
    dueDate: daysAgo(6),
  });
  await setApproval(project2.id, 2, {
    status: ApprovalStepStatus.SUBMITTED,
    officerId: officerNellore.id,
    submissionDate: daysAgo(4),
    dueDate: daysFromNow(11),
  });

  await prisma.documentItem.createMany({
    data: [
      { projectId: project2.id, type: "Electricity Bill", status: DocumentStatus.ACCEPTED, uploadedAt: daysAgo(9) },
      { projectId: project2.id, type: "Aadhaar", status: DocumentStatus.ACCEPTED, uploadedAt: daysAgo(9) },
      { projectId: project2.id, type: "PAN", status: DocumentStatus.RECEIVED, uploadedAt: daysAgo(8) },
      { projectId: project2.id, type: "Bank Proof", status: DocumentStatus.PENDING },
      { projectId: project2.id, type: "Ownership Proof", status: DocumentStatus.PENDING },
      { projectId: project2.id, type: "Roof Photos", status: DocumentStatus.PENDING },
    ],
  });

  await prisma.subsidy.create({
    data: {
      projectId: project2.id,
      isEligible: true,
      expectedAmount: slabFor(3).amount,
      slabId: slabFor(3).id,
      isDbtToCustomer: true,
    },
  });

  await prisma.clientInvoice.create({
    data: {
      invoiceNumber: "SPG-2026-0003",
      projectId: project2.id,
      milestoneType: PaymentMilestoneType.ADVANCE,
      amount: 107500,
      status: InvoiceStatus.DRAFT,
      issueDate: daysAgo(1),
      dueDate: daysFromNow(14),
    },
  });

  // --- Project 3: Venkatesh Rao — commercial (subsidy ineligible), non-ALMM panel allocated ---
  const project3 = await prisma.project.create({
    data: {
      title: "Rooftop Solar — Venkatesh Industrial Shed",
      customerId: customerVenkatesh.id,
      systemSizeKw: 10,
      contractValue: 700000,
      paymentTermsNotes: "30% advance, 40% on delivery, 30% on commissioning.",
      startDate: daysAgo(25),
      expectedCompletionDate: daysFromNow(35),
    },
  });
  await prisma.lead.create({
    data: {
      customerId: customerVenkatesh.id,
      status: LeadStatus.WON,
      assignedToId: users.SALES.id,
      convertedAt: daysAgo(27),
      projectId: project3.id,
    },
  });
  await instantiateWorkflow(project3.id, users.LIAISON.id);

  await setStage(project3.id, 1, { status: StageStatus.DONE, startDate: daysAgo(25), completedDate: daysAgo(25) });
  await setStage(project3.id, 2, { status: StageStatus.DONE, startDate: daysAgo(24), completedDate: daysAgo(20) });
  await setStage(project3.id, 3, { status: StageStatus.DONE, startDate: daysAgo(19), completedDate: daysAgo(17) });
  await setStage(project3.id, 4, { status: StageStatus.DONE, startDate: daysAgo(16), completedDate: daysAgo(5) });
  await setStage(project3.id, 5, { status: StageStatus.DONE, startDate: daysAgo(4), completedDate: daysAgo(2) });
  await setStage(project3.id, 6, { status: StageStatus.NOT_STARTED, targetDate: daysFromNow(15) });

  await setApproval(project3.id, 1, { status: ApprovalStepStatus.APPROVED, submissionDate: daysAgo(24), approvalDate: daysAgo(21), dueDate: daysAgo(21) });
  await setApproval(project3.id, 2, { status: ApprovalStepStatus.APPROVED, officerId: officerKurnool.id, submissionDate: daysAgo(20), approvalDate: daysAgo(5), dueDate: daysAgo(5) });

  await prisma.subsidy.create({
    data: {
      projectId: project3.id,
      isEligible: false, // PM Surya Ghar: commercial systems are not eligible
      expectedAmount: 0,
      isDbtToCustomer: false,
    },
  });

  await prisma.clientInvoice.create({
    data: {
      invoiceNumber: "SPG-2026-0004",
      projectId: project3.id,
      milestoneType: PaymentMilestoneType.ADVANCE,
      amount: 210000,
      status: InvoiceStatus.PAID,
      issueDate: daysAgo(26),
      dueDate: daysAgo(20),
    },
  });

  // Allocate non-ALMM Adani panels — triggers the ALMM rule-warning banner.
  const p3PanelSerials = adaniPanelSerials.slice(0, 20);
  await prisma.stockItem.updateMany({
    where: { id: { in: p3PanelSerials.map((s) => s.id) } },
    data: { status: StockItemStatus.RESERVED, projectId: project3.id, reservedAt: daysAgo(2) },
  });

  // --- Project 4: Krishna Murthy — fully closed, for margin/finance completeness ---
  const project4 = await prisma.project.create({
    data: {
      title: "Rooftop Solar — Murthy Residence",
      customerId: customerKrishna.id,
      systemSizeKw: 3,
      contractValue: 215000,
      status: "CLOSED",
      paymentTermsNotes: "Full payment on commissioning.",
      startDate: daysAgo(120),
      expectedCompletionDate: daysAgo(75),
      actualCompletionDate: daysAgo(78),
    },
  });
  await prisma.lead.create({
    data: {
      customerId: customerKrishna.id,
      status: LeadStatus.WON,
      assignedToId: users.SALES.id,
      convertedAt: daysAgo(122),
      projectId: project4.id,
    },
  });
  await instantiateWorkflow(project4.id, users.LIAISON.id);
  for (const s of stageDefs) {
    await setStage(project4.id, s.order, { status: StageStatus.DONE, startDate: daysAgo(120), completedDate: daysAgo(80) });
  }
  for (const a of approvalDefs) {
    await setApproval(project4.id, a.order, {
      status: ApprovalStepStatus.APPROVED,
      submissionDate: daysAgo(110),
      approvalDate: daysAgo(90),
      dueDate: daysAgo(95),
    });
  }
  await prisma.documentItem.createMany({
    data: [
      { projectId: project4.id, type: "Electricity Bill", status: DocumentStatus.ACCEPTED, uploadedAt: daysAgo(118) },
      { projectId: project4.id, type: "Aadhaar", status: DocumentStatus.ACCEPTED, uploadedAt: daysAgo(118) },
      { projectId: project4.id, type: "PAN", status: DocumentStatus.ACCEPTED, uploadedAt: daysAgo(118) },
      { projectId: project4.id, type: "Ownership Proof", status: DocumentStatus.ACCEPTED, uploadedAt: daysAgo(115) },
      { projectId: project4.id, type: "Roof Photos", status: DocumentStatus.ACCEPTED, uploadedAt: daysAgo(115) },
      { projectId: project4.id, type: "Bank Proof", status: DocumentStatus.ACCEPTED, uploadedAt: daysAgo(115) },
    ],
  });
  await prisma.subsidy.create({
    data: {
      projectId: project4.id,
      isEligible: true,
      expectedAmount: slabFor(3).amount,
      slabId: slabFor(3).id,
      claimDate: daysAgo(76),
      referenceNumber: "SUB-AP-2026-3391",
      receivedDate: daysAgo(50),
      isDbtToCustomer: true,
    },
  });
  await prisma.costEntry.createMany({
    data: [
      { projectId: project4.id, category: CostCategory.LABOUR, amount: 18000, description: "Installation crew", date: daysAgo(85), enteredById: users.ACCOUNTS.id },
      { projectId: project4.id, category: CostCategory.TRANSPORT, amount: 4000, description: "Material transport", date: daysAgo(88), enteredById: users.ACCOUNTS.id },
      { projectId: project4.id, category: CostCategory.LIAISON, amount: 2500, description: "Liaison charges", date: daysAgo(100), enteredById: users.LIAISON.id },
    ],
  });
  const inv4 = await prisma.clientInvoice.create({
    data: {
      invoiceNumber: "SPG-2025-0091",
      projectId: project4.id,
      milestoneType: PaymentMilestoneType.BALANCE,
      amount: 215000,
      status: InvoiceStatus.PAID,
      issueDate: daysAgo(80),
      dueDate: daysAgo(70),
    },
  });
  await prisma.payment.create({
    data: { clientInvoiceId: inv4.id, amount: 215000, date: daysAgo(77), mode: PaymentMode.UPI, referenceNumber: "UPI2025120077", recordedById: users.ACCOUNTS.id },
  });

  const p4PanelSerials = waareePanelSerials.slice(10, 16);
  await prisma.stockItem.updateMany({
    where: { id: { in: p4PanelSerials.map((s) => s.id) } },
    data: { status: StockItemStatus.INSTALLED, projectId: project4.id, reservedAt: daysAgo(95), issuedAt: daysAgo(90), issuedById: users.INVENTORY_MANAGER.id, installedAt: daysAgo(80), installedConfirmedById: users.SITE_SUPERVISOR.id },
  });

  console.log("Seed complete.");
  console.log("Logins:");
  for (const [role, info] of Object.entries(roleUsers)) {
    console.log(`  ${role}: ${info.email} / ${info.password}`);
  }
  console.log("  CUSTOMER: ravi.kumar@example.com / Customer@123 (Project 1 — active, oversize warning)");
  console.log("  CUSTOMER: lakshmi.reddy@example.com / Customer@123 (Project 2 — early stage)");
  console.log("  CUSTOMER: krishna.murthy@example.com / Customer@123 (Project 4 — closed)");
  console.log("  (Venkatesh Rao, commercial customer, has no portal login by design.)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
