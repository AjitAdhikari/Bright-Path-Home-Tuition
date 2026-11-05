"use client";

import { useActionState } from "react";
import {
  AlertCircle,
  Clock,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { lookupApplication, type LookupState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Field";
import { Card, Badge } from "@/components/ui/Card";
import {
  APPLICATION_STATUS_TONE,
  type ApplicationStatus,
} from "@/lib/constants";

const initial: LookupState = { ok: false };

const ICON: Record<ApplicationStatus, typeof Clock> = {
  pending_review: Clock,
  under_review: Search,
  changes_requested: AlertTriangle,
  approved: CheckCircle2,
  rejected: XCircle,
};

const NEXT_STEPS: Record<ApplicationStatus, string> = {
  pending_review:
    "Your application is in the queue. Our admin team will review it shortly — no action needed.",
  under_review:
    "An admin is reviewing your qualifications and documents. We'll email you when there's a decision.",
  changes_requested:
    "Our team asked for some changes (see below). Please reply to our email or resubmit the requested details.",
  approved:
    "Your application is approved! Check your email for a link to set your password and sign in to your Teacher Dashboard.",
  rejected:
    "After review, your application was not approved at this time. See any note below.",
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function StatusLookup() {
  const [state, action, pending] = useActionState(lookupApplication, initial);
  const r = state.result;

  return (
    <div className="space-y-6">
      <Card>
        <form action={action} className="space-y-4">
          <div>
            <Label>Application ID</Label>
            <Input name="application_number" required placeholder="BP-2026-00001" />
          </div>
          <div>
            <Label>Email used to apply</Label>
            <Input name="email" type="email" required placeholder="you@example.com" />
          </div>
          {state.error && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Checking…" : "Check status"}
          </Button>
        </form>
      </Card>

      {r &&
        (() => {
          const Icon = ICON[r.status];
          return (
            <Card className="space-y-5">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-bold text-foreground">
                      Application {r.statusLabel}
                    </h2>
                    <Badge tone={APPLICATION_STATUS_TONE[r.status]}>
                      {r.statusLabel}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {NEXT_STEPS[r.status]}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Application ID
                  </p>
                  <p className="mt-1 font-mono font-semibold text-foreground">
                    {r.applicationNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Submitted
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {fmt(r.submittedAt)}
                  </p>
                </div>
              </div>
              {r.status === "changes_requested" && (
                <div className="rounded-xl border border-warning/40 bg-warning/5 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">
                    Changes requested
                  </p>
                  {r.feedback && (
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                      {r.feedback}
                    </p>
                  )}
                  <a
                    href="/become-tutor"
                    className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110"
                  >
                    Update &amp; resubmit application
                  </a>
                </div>
              )}
              {r.status === "rejected" && r.rejectionReason && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">Reviewer note</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                    {r.rejectionReason}
                  </p>
                </div>
              )}
            </Card>
          );
        })()}
    </div>
  );
}
