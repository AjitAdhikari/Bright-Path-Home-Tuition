"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Field";

/**
 * Finishes account setup after the approval email's recovery link. The Supabase
 * client parses the recovery token from the URL and establishes a session; we
 * then let the tutor set their password with `updateUser`.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // The link may establish the session immediately, or via the
    // PASSWORD_RECOVERY auth event once the token in the URL is processed.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setHasSession(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasSession(true);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const confirm = String(form.get("confirm"));
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: upErr } = await supabase.auth.updateUser({ password });
    if (upErr) {
      setLoading(false);
      setError("Couldn't set your password. The link may have expired — use “Forgot password” on the login page.");
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/tutor");
      router.refresh();
    }, 1200);
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        Password set. Taking you to your dashboard…
      </div>
    );
  }

  if (ready && !hasSession) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          This link is invalid or has expired. Please use “Forgot password” on
          the login page with the email you applied with.
        </div>
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
        <Label hint="min 8 characters">New password</Label>
        <div className="relative">
          <Input
            name="password"
            type={show ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>
      <div>
        <Label>Confirm password</Label>
        <Input name="confirm" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" placeholder="••••••••" />
      </div>
      <Button type="submit" size="lg" disabled={loading || !hasSession} className="w-full">
        {loading ? "Saving…" : "Set password & continue"}
      </Button>
    </form>
  );
}
