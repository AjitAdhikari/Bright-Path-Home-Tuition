import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div>
      <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
        Tutor &amp; admin access
      </span>
      <h1 className="font-heading mt-5 text-3xl font-semibold tracking-tight text-foreground">
        Welcome back
      </h1>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        Log in to reach your dashboard and pick up where you left off.
      </p>

      <div className="mt-8">
        <Suspense
          fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}
        >
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        New tutor?{" "}
        <Link
          href="/become-tutor"
          className="font-semibold text-primary hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
