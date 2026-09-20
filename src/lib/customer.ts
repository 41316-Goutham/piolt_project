import { prisma } from "@/lib/prisma";

export async function getCustomerForUser(userId: string) {
  return prisma.customer.findUnique({ where: { userId } });
}
