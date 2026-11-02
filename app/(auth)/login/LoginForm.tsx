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
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(params.get("next") ?? "/tutor");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
        {loading ? "Logging in…" : "Log in"}
      </Button>
      <p className="text-center text-xs text-ink-400">
        Tutors can also log in with a phone OTP — ask us on WhatsApp if you need it.
      </p>
    </form>
  );
}
