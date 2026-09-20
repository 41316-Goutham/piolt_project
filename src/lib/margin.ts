import { prisma } from "@/lib/prisma";

export type ProjectMargin = {
  contractValue: number;
  invoicedRevenue: number;
  panelInverterCost: number;
  otherCost: number;
  totalCost: number;
  expectedMargin: number;
  expectedMarginPercent: number;
  actualMargin: number;
  actualMarginPercent: number;
};

function computeMargin(
  contractValue: number,
  panelInverterCost: number,
  otherCost: number,
  invoicedRevenue: number
): ProjectMargin {
  const totalCost = panelInverterCost + otherCost;
  const expectedMargin = contractValue - totalCost;
  const actualMargin = invoicedRevenue - totalCost;

  return {
    contractValue,
    invoicedRevenue,
    panelInverterCost,
    otherCost,
    totalCost,
    expectedMargin,
    expectedMarginPercent: contractValue > 0 ? (expectedMargin / contractValue) * 100 : 0,
    actualMargin,
    actualMarginPercent: invoicedRevenue > 0 ? (actualMargin / invoicedRevenue) * 100 : 0,
  };
}

export async function getProjectMargin(projectId: string): Promise<ProjectMargin> {
  const [project, stockItems, costEntries, clientInvoices] = await Promise.all([
    prisma.project.findUniqueOrThrow({ where: { id: projectId } }),
    prisma.stockItem.findMany({
      where: { projectId, status: { in: ["ISSUED", "INSTALLED"] } },
      select: { unitCost: true },
    }),
    prisma.costEntry.findMany({ where: { projectId }, select: { amount: true } }),
    prisma.clientInvoice.findMany({ where: { projectId }, select: { amount: true } }),
  ]);

  return computeMargin(
    project.contractValue,
    stockItems.reduce((sum, s) => sum + s.unitCost, 0),
    costEntries.reduce((sum, c) => sum + c.amount, 0),
    clientInvoices.reduce((sum, i) => sum + i.amount, 0)
  );
}

// Batched variant for dashboards that need margin across many projects at
// once — always exactly 4 queries total, regardless of project count, to
// avoid opening a connection per project against a constrained pool.
export async function getProjectMargins(projectIds: string[]): Promise<Map<string, ProjectMargin>> {
  const [projects, stockItems, costEntries, clientInvoices] = await Promise.all([
    prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, contractValue: true } }),
    prisma.stockItem.findMany({
      where: { projectId: { in: projectIds }, status: { in: ["ISSUED", "INSTALLED"] } },
      select: { projectId: true, unitCost: true },
    }),
    prisma.costEntry.findMany({ where: { projectId: { in: projectIds } }, select: { projectId: true, amount: true } }),
    prisma.clientInvoice.findMany({ where: { projectId: { in: projectIds } }, select: { projectId: true, amount: true } }),
  ]);

  const panelInverterCostByProject = new Map<string, number>();
  for (const s of stockItems) {
    if (!s.projectId) continue;
    panelInverterCostByProject.set(s.projectId, (panelInverterCostByProject.get(s.projectId) ?? 0) + s.unitCost);
  }
  const otherCostByProject = new Map<string, number>();
  for (const c of costEntries) {
    otherCostByProject.set(c.projectId, (otherCostByProject.get(c.projectId) ?? 0) + c.amount);
  }
  const invoicedRevenueByProject = new Map<string, number>();
  for (const i of clientInvoices) {
    invoicedRevenueByProject.set(i.projectId, (invoicedRevenueByProject.get(i.projectId) ?? 0) + i.amount);
  }

  const result = new Map<string, ProjectMargin>();
  for (const project of projects) {
    result.set(
      project.id,
      computeMargin(
        project.contractValue,
        panelInverterCostByProject.get(project.id) ?? 0,
        otherCostByProject.get(project.id) ?? 0,
        invoicedRevenueByProject.get(project.id) ?? 0
      )
    );
  }
  return result;
}
