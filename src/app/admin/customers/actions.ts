"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireSession() {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");
  return session;
}

export async function createCustomer(formData: FormData) {
  await requireSession();
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const district = (formData.get("district") as string) || null;
  const discom = (formData.get("discom") as string) || null;
  const category = (formData.get("category") as string) || null;

  const customer = await prisma.customer.create({
    data: { name, phone, district, discom: discom as never, category: category as never },
  });
  revalidatePath("/admin/customers");
  redirect(`/admin/customers/${customer.id}`);
}

export async function updateCustomer(customerId: string, formData: FormData) {
  await requireSession();
  const data = {
    address: (formData.get("address") as string) || null,
    district: (formData.get("district") as string) || null,
    discom: (formData.get("discom") as string || null) as never,
    serviceNumber: (formData.get("serviceNumber") as string) || null,
    consumerNumber: (formData.get("consumerNumber") as string) || null,
    sanctionedLoadKw: formData.get("sanctionedLoadKw") ? parseFloat(formData.get("sanctionedLoadKw") as string) : null,
    category: (formData.get("category") as string || null) as never,
    roofOwnership: (formData.get("roofOwnership") as string) || null,
  };
  await prisma.customer.update({ where: { id: customerId }, data });
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function provisionPortalLogin(customerId: string, formData: FormData) {
  await requireSession();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name: customer.name, email, passwordHash, role: "CUSTOMER" },
  });
  await prisma.customer.update({ where: { id: customerId }, data: { userId: user.id } });
  revalidatePath(`/admin/customers/${customerId}`);
}
