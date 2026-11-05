"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Field";

/**
 * Sends a password-recovery email via Supabase. The link lands on
 * /reset-password, where the recovery session lets the user set a new password.
 * We always show the same success message whether or not the email exists, so
 * the form can't be used to probe which addresses have accounts.
 */
export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    if (!email) return;

    setLoading(true);
    const supabase = createClient();
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (resetErr) {
      setError("We couldn't send the email just now. Please try again in a moment.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        If an account exists for that email, a link to set a new password is on
        its way. Check your inbox (and spam folder).
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}
      <div>
        <Label>Email</Label>
        <Input name="email" type="email" required placeholder="you@example.com" />
      </div>
      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
