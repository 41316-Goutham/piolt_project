import { prisma } from "@/lib/prisma";

// PRD acceptance criterion: "a project cannot be moved to Installation without allocated material"
export async function hasAllocatedMaterial(projectId: string): Promise<boolean> {
  const count = await prisma.stockItem.count({
    where: {
      projectId,
      status: { in: ["RESERVED", "ISSUED", "INSTALLED"] },
    },
  });
  return count > 0;
}

export type ProjectWarning = { type: "OVERSIZE" | "NON_ALMM"; message: string };

export async function getProjectWarnings(projectId: string): Promise<ProjectWarning[]> {
  const warnings: ProjectWarning[] = [];

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { customer: true },
  });
  if (!project) return warnings;

  if (project.customer.sanctionedLoadKw != null && project.systemSizeKw > project.customer.sanctionedLoadKw) {
    warnings.push({
      type: "OVERSIZE",
      message: `System size (${project.systemSizeKw} kW) exceeds the customer's sanctioned load (${project.customer.sanctionedLoadKw} kW). A load-enhancement request may be required.`,
    });
  }

  const nonAlmmCount = await prisma.stockItem.count({
    where: { projectId, product: { isAlmmCompliant: false } },
  });
  if (nonAlmmCount > 0) {
    warnings.push({
      type: "NON_ALMM",
      message: `${nonAlmmCount} allocated item(s) are not ALMM-compliant. This can cause inspection failure and loss of subsidy.`,
    });
  }

  return warnings;
}
