"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Only admins can edit subsidy slabs.");
  }
}

export async function updateSubsidySlab(slabId: string, formData: FormData) {
  await requireAdmin();
  await prisma.subsidySlab.update({
    where: { id: slabId },
    data: {
      minKw: parseFloat(formData.get("minKw") as string),
      maxKw: formData.get("maxKw") ? parseFloat(formData.get("maxKw") as string) : null,
      amount: parseFloat(formData.get("amount") as string),
      label: (formData.get("label") as string) || null,
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidatePath("/admin/settings/subsidy-slabs");
}

export async function createSubsidySlab(formData: FormData) {
  await requireAdmin();
  await prisma.subsidySlab.create({
    data: {
      minKw: parseFloat(formData.get("minKw") as string),
      maxKw: formData.get("maxKw") ? parseFloat(formData.get("maxKw") as string) : null,
      amount: parseFloat(formData.get("amount") as string),
      label: (formData.get("label") as string) || null,
    },
  });
  revalidatePath("/admin/settings/subsidy-slabs");
}
