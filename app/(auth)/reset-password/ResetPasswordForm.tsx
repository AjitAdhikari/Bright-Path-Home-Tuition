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

    // Listen for the recovery session being established from the link.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setHasSession(true);
    });

    async function establish() {
      // 1. If Supabase redirected back with an explicit error (expired/used
      //    link), it lands in the URL hash or query — surface it plainly.
      const hash = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      );
      const query = new URLSearchParams(window.location.search);
      const errDesc =
        hash.get("error_description") ?? query.get("error_description");
      if (errDesc) {
        setError(
          "This link has expired or was already used. Request a new one below."
        );
        setReady(true);
        return;
      }

      // 2. PKCE links come back as ?code=…; exchange it for a session. (Hash
      //    token links are handled automatically by detectSessionInUrl.)
      const code = query.get("code");
      if (code) {
        const { error: exErr } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exErr) {
          setError(
            "This link has expired or was already used. Request a new one below."
          );
          setReady(true);
          return;
        }
      }

      // 3. Whatever route we took, check whether a session now exists.
      const { data } = await supabase.auth.getSession();
      if (data.session) setHasSession(true);
      setReady(true);
    }

    establish();
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
      const msg = upErr.message.toLowerCase();
      // "Auth session missing" / expired token → the link is no longer valid.
      if (msg.includes("session") || msg.includes("expired") || msg.includes("token")) {
        setError(
          "Your set-password link has expired. Request a fresh one below and try again."
        );
      } else {
        setError(upErr.message);
      }
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
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error ??
            "This link is invalid or has expired. Request a fresh link with the email you applied with."}
        </div>
        <a
          href="/forgot-password"
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110"
        >
          Request a new link
        </a>
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
