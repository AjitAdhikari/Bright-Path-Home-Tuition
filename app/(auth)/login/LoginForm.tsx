"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Field";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });

    if (error) {
      setLoading(false);
      // Don't echo raw auth errors — they can hint at which emails exist.
      setError(
        error.message.toLowerCase().includes("invalid")
          ? "That email and password don't match. Please try again."
          : "We couldn't sign you in just now. Please try again in a moment."
      );
      return;
    }

    // Send each person to their own area; middleware also enforces this.
    const { data } = await supabase.auth.getUser();
    const role = data.user?.user_metadata?.role as string | undefined;
    const home =
      role === "admin" ? "/admin" : role === "parent" ? "/parent" : "/tutor";
    router.push(params.get("next") ?? home);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div>
        <Label>Email</Label>
        <Input name="email" type="email" required placeholder="you@example.com" />
      </div>
      <div>
        <Label>Password</Label>
        <Input name="password" type="password" required placeholder="••••••••" />
      </div>
      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? "Signing in…" : "Log in"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Trouble signing in? Message us on WhatsApp and we&apos;ll help.
      </p>
    </form>
  );
}
