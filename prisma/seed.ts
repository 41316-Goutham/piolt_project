import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.invoice.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const customerPasswordHash = await bcrypt.hash("Customer@123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "admin@sunpowergenesys.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      phone: "+91 98765 43210",
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: "Ravi Kumar",
      email: "ravi.kumar@example.com",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
      phone: "+91 90000 11111",
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Anjali Mehta",
      email: "anjali.mehta@example.com",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
      phone: "+91 90000 22222",
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      name: "Suresh Rao",
      email: "suresh.rao@example.com",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
      phone: "+91 90000 33333",
    },
  });

  const waaree = await prisma.company.create({
    data: {
      name: "Waaree",
      contactEmail: "partners@waaree.com",
      contactPhone: "+91 22 6644 5566",
      notes: "Primary OEM partner for panels and inverters",
    },
  });

  const adani = await prisma.company.create({
    data: {
      name: "Adani Solar",
      contactEmail: "channel@adanisolar.com",
    },
  });

  const luminous = await prisma.company.create({
    data: {
      name: "Luminous",
      contactEmail: "sales@luminous.com",
      notes: "Batteries and BOS components",
    },
  });

  const inventoryItems = await Promise.all([
    prisma.inventoryItem.create({
      data: {
        name: "Waaree 550W Mono PERC Panel",
        sku: "WAR-PNL-550",
        category: "PANEL",
        companyId: waaree.id,
        quantityInStock: 240,
        unit: "pcs",
        unitPrice: 12500,
        reorderLevel: 50,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        name: "Waaree 5kW String Inverter",
        sku: "WAR-INV-5K",
        category: "INVERTER",
        companyId: waaree.id,
        quantityInStock: 18,
        unit: "pcs",
        unitPrice: 45000,
        reorderLevel: 15,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        name: "Adani 400W Mono Panel",
        sku: "ADN-PNL-400",
        category: "PANEL",
        companyId: adani.id,
        quantityInStock: 120,
        unit: "pcs",
        unitPrice: 9800,
        reorderLevel: 40,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        name: "Luminous 150Ah Solar Battery",
        sku: "LUM-BAT-150",
        category: "BATTERY",
        companyId: luminous.id,
        quantityInStock: 32,
        unit: "pcs",
        unitPrice: 15500,
        reorderLevel: 20,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        name: "Galvanized Mounting Structure (per kW)",
        sku: "GEN-STR-1KW",
        category: "STRUCTURE",
        companyId: waaree.id,
        quantityInStock: 60,
        unit: "sets",
        unitPrice: 4500,
        reorderLevel: 25,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        name: "4 sq mm DC Solar Cable (100m roll)",
        sku: "GEN-CBL-DC4",
        category: "CABLE",
        companyId: waaree.id,
        quantityInStock: 15,
        unit: "rolls",
        unitPrice: 6200,
        reorderLevel: 15,
      },
    }),
  ]);

  const [panelWaaree, inverterWaaree, , batteryLuminous, structureWaaree] = inventoryItems;

  const project1 = await prisma.project.create({
    data: {
      title: "Rooftop Solar - Kumar Residence",
      siteAddress: "12 MG Road, Bengaluru, KA",
      capacityKw: 5,
      customerId: customer1.id,
      companyId: waaree.id,
      sanctionedAmount: 350000,
      totalCost: 375000,
      subsidyAmount: 78000,
      status: "IN_PROGRESS",
      progressPercent: 60,
      startDate: new Date("2026-07-01"),
      expectedCompletionDate: new Date("2026-09-30"),
      milestones: {
        create: [
          { title: "Site survey completed", order: 1, status: "COMPLETED", plannedDate: new Date("2026-07-05"), completedDate: new Date("2026-07-04") },
          { title: "Design & DISCOM approval", order: 2, status: "COMPLETED", plannedDate: new Date("2026-07-15"), completedDate: new Date("2026-07-18") },
          { title: "Material dispatched to site", order: 3, status: "COMPLETED", plannedDate: new Date("2026-07-25"), completedDate: new Date("2026-07-26") },
          { title: "Structure & panel installation", order: 4, status: "IN_PROGRESS", plannedDate: new Date("2026-08-15") },
          { title: "Inverter commissioning", order: 5, status: "PENDING", plannedDate: new Date("2026-09-10") },
          { title: "Net-metering & final handover", order: 6, status: "PENDING", plannedDate: new Date("2026-09-30") },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      title: "Rooftop Solar - Mehta Villa",
      siteAddress: "45 Park Street, Pune, MH",
      capacityKw: 8,
      customerId: customer2.id,
      companyId: adani.id,
      sanctionedAmount: 560000,
      totalCost: 590000,
      subsidyAmount: 78000,
      status: "SANCTIONED",
      progressPercent: 20,
      startDate: new Date("2026-08-20"),
      expectedCompletionDate: new Date("2026-11-15"),
      milestones: {
        create: [
          { title: "Site survey completed", order: 1, status: "COMPLETED", plannedDate: new Date("2026-08-22"), completedDate: new Date("2026-08-22") },
          { title: "Design & DISCOM approval", order: 2, status: "IN_PROGRESS", plannedDate: new Date("2026-09-05") },
          { title: "Material dispatched to site", order: 3, status: "PENDING", plannedDate: new Date("2026-09-20") },
          { title: "Structure & panel installation", order: 4, status: "PENDING", plannedDate: new Date("2026-10-10") },
          { title: "Inverter commissioning", order: 5, status: "PENDING", plannedDate: new Date("2026-10-25") },
          { title: "Net-metering & final handover", order: 6, status: "PENDING", plannedDate: new Date("2026-11-15") },
        ],
      },
    },
  });

  const project3 = await prisma.project.create({
    data: {
      title: "Rooftop Solar - Rao Bungalow",
      siteAddress: "9 Lake View Road, Hyderabad, TS",
      capacityKw: 3,
      customerId: customer3.id,
      companyId: waaree.id,
      sanctionedAmount: 210000,
      totalCost: 215000,
      subsidyAmount: 46800,
      status: "COMMISSIONED",
      progressPercent: 100,
      startDate: new Date("2026-04-10"),
      expectedCompletionDate: new Date("2026-05-20"),
      actualCompletionDate: new Date("2026-05-18"),
      milestones: {
        create: [
          { title: "Site survey completed", order: 1, status: "COMPLETED", plannedDate: new Date("2026-04-12"), completedDate: new Date("2026-04-12") },
          { title: "Design & DISCOM approval", order: 2, status: "COMPLETED", plannedDate: new Date("2026-04-20"), completedDate: new Date("2026-04-19") },
          { title: "Material dispatched to site", order: 3, status: "COMPLETED", plannedDate: new Date("2026-04-28"), completedDate: new Date("2026-04-28") },
          { title: "Structure & panel installation", order: 4, status: "COMPLETED", plannedDate: new Date("2026-05-05"), completedDate: new Date("2026-05-06") },
          { title: "Inverter commissioning", order: 5, status: "COMPLETED", plannedDate: new Date("2026-05-12"), completedDate: new Date("2026-05-12") },
          { title: "Net-metering & final handover", order: 6, status: "COMPLETED", plannedDate: new Date("2026-05-20"), completedDate: new Date("2026-05-18") },
        ],
      },
    },
  });

  await prisma.sale.createMany({
    data: [
      { inventoryItemId: panelWaaree.id, projectId: project1.id, quantity: 10, unitPrice: 12500, totalAmount: 125000, saleDate: new Date("2026-07-26") },
      { inventoryItemId: inverterWaaree.id, projectId: project1.id, quantity: 1, unitPrice: 45000, totalAmount: 45000, saleDate: new Date("2026-07-26") },
      { inventoryItemId: structureWaaree.id, projectId: project1.id, quantity: 5, unitPrice: 4500, totalAmount: 22500, saleDate: new Date("2026-07-26") },
      { inventoryItemId: batteryLuminous.id, projectId: project3.id, quantity: 2, unitPrice: 15500, totalAmount: 31000, saleDate: new Date("2026-04-28") },
      { inventoryItemId: panelWaaree.id, projectId: project3.id, quantity: 6, unitPrice: 12500, totalAmount: 75000, saleDate: new Date("2026-04-28") },
    ],
  });

  await prisma.invoice.createMany({
    data: [
      {
        invoiceNumber: "INV-2026-0001",
        projectId: project1.id,
        amount: 175000,
        status: "PAID",
        issueDate: new Date("2026-07-10"),
        dueDate: new Date("2026-07-20"),
        paidDate: new Date("2026-07-18"),
        description: "Advance payment (50%)",
      },
      {
        invoiceNumber: "INV-2026-0002",
        projectId: project1.id,
        amount: 175000,
        status: "SENT",
        issueDate: new Date("2026-08-25"),
        dueDate: new Date("2026-09-10"),
        description: "Balance payment on installation completion",
      },
      {
        invoiceNumber: "INV-2026-0003",
        projectId: project2.id,
        amount: 280000,
        status: "SENT",
        issueDate: new Date("2026-08-22"),
        dueDate: new Date("2026-09-05"),
        description: "Advance payment (50%)",
      },
      {
        invoiceNumber: "INV-2026-0004",
        projectId: project3.id,
        amount: 215000,
        status: "PAID",
        issueDate: new Date("2026-04-15"),
        dueDate: new Date("2026-04-25"),
        paidDate: new Date("2026-04-24"),
        description: "Full payment",
      },
    ],
  });

  console.log("Seed complete.");
  console.log(`Admin login: ${admin.email} / Admin@123`);
  console.log(`Customer logins: ${customer1.email}, ${customer2.email}, ${customer3.email} / Customer@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
