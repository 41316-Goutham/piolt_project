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

  const panelInverterCost = stockItems.reduce((sum, s) => sum + s.unitCost, 0);
  const otherCost = costEntries.reduce((sum, c) => sum + c.amount, 0);
  const totalCost = panelInverterCost + otherCost;
  const invoicedRevenue = clientInvoices.reduce((sum, i) => sum + i.amount, 0);

  const expectedMargin = project.contractValue - totalCost;
  const actualMargin = invoicedRevenue - totalCost;

  return {
    contractValue: project.contractValue,
    invoicedRevenue,
    panelInverterCost,
    otherCost,
    totalCost,
    expectedMargin,
    expectedMarginPercent: project.contractValue > 0 ? (expectedMargin / project.contractValue) * 100 : 0,
    actualMargin,
    actualMarginPercent: invoicedRevenue > 0 ? (actualMargin / invoicedRevenue) * 100 : 0,
  };
}
