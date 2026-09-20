"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createOfficer(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");

  await prisma.officer.create({
    data: {
      discom: formData.get("discom") as never,
      circle: (formData.get("circle") as string) || null,
      division: (formData.get("division") as string) || null,
      section: (formData.get("section") as string) || null,
      name: formData.get("name") as string,
      designation: formData.get("designation") as string,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
    },
  });
  revalidatePath("/admin/officers");
}
