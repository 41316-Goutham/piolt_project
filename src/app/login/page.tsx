"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state.redirectTo, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <span className="h-8 w-8 rounded-full bg-amber-500 inline-block" />
            <span className="font-semibold text-lg text-slate-900">SunPower GeneSys</span>
          </Link>
          <p className="text-sm text-slate-500 mt-2">Sign in to your account</p>
        </div>

        <form action={formAction} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="••••••••"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-medium py-2.5 text-sm transition-colors"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
          <p className="font-medium text-slate-500">Demo credentials</p>
          <p>Admin: admin@sunpowergenesys.com / Admin@123</p>
          <p>Customer: ravi.kumar@example.com / Customer@123</p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link href="/" className="hover:text-amber-600">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
