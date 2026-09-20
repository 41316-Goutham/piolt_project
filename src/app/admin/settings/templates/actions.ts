"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Only admins can edit templates.");
  }
}

export async function updateStageTemplateStep(stepId: string, formData: FormData) {
  await requireAdmin();
  await prisma.stageTemplateStep.update({
    where: { id: stepId },
    data: {
      order: parseInt(formData.get("order") as string, 10),
      stepName: formData.get("stepName") as string,
      defaultSlaDays: formData.get("defaultSlaDays") ? parseInt(formData.get("defaultSlaDays") as string, 10) : null,
      requiresAllocation: formData.get("requiresAllocation") === "on",
    },
  });
  revalidatePath("/admin/settings/templates");
}

export async function updateApprovalTemplateStep(stepId: string, formData: FormData) {
  await requireAdmin();
  const requiredDocumentTypes = ((formData.get("requiredDocumentTypes") as string) || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.approvalTemplateStep.update({
    where: { id: stepId },
    data: {
      order: parseInt(formData.get("order") as string, 10),
      stepName: formData.get("stepName") as string,
      slaDays: parseInt(formData.get("slaDays") as string, 10),
      requiredDocumentTypes,
    },
  });
  revalidatePath("/admin/settings/templates");
}
