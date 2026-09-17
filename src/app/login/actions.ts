"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";

export type LoginState = {
  error: string | null;
  redirectTo?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  return { error: null, redirectTo: user?.role === "ADMIN" ? "/admin" : "/portal" };
}
