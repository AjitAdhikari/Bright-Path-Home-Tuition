import {
  Clock,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Mail,
} from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  type ApplicationStatus,
} from "@/lib/constants";

type AppRow = {
  id: string;
  application_number: string;
  status: ApplicationStatus;
  submitted_at: string | null;
  rejection_reason: string | null;
  admin_feedback: string | null;
  updated_at: string | null;
};

const ICON: Record<ApplicationStatus, typeof Clock> = {
  pending_review: Clock,
  under_review: Search,
  changes_requested: AlertTriangle,
  approved: CheckCircle2,
  rejected: XCircle,
};

const NEXT_STEPS: Record<ApplicationStatus, string> = {
  pending_review:
    "Your application is in the queue. Our admin team will begin reviewing it shortly — no action needed from you right now.",
  under_review:
    "An admin is currently reviewing your qualifications and documents. We'll email you as soon as a decision is made.",
  changes_requested:
    "Please review the feedback below, update the requested details on your documents and profile, then resubmit for review.",
  approved:
    "Congratulations — your application is approved. You now have full access to your Teacher Dashboard.",
  rejected:
    "After review, your application was not approved at this time. See any feedback below; you're welcome to apply again later.",
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Resubmit after "changes requested". RLS + the guard trigger only permit the
 *  changes_requested -> pending_review transition for the owning tutor. */
async function resubmit() {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase
    .from("tutor_applications")
    .update({ status: "pending_review" } as never)
    .eq("tutor_id", user.id)
    .eq("status", "changes_requested");
  revalidatePath("/tutor/application-status");
}

export default async function ApplicationStatusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("tutor_applications")
    .select(
      "id, application_number, status, submitted_at, rejection_reason, admin_feedback, updated_at"
    )
    .eq("tutor_id", user?.id ?? "")
    .maybeSingle();

  const app = data as AppRow | null;

  if (!app) {
    return (
      <div className="max-w-2xl">
        <Card className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <FileText className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="mt-4 text-xl font-bold text-foreground">
            No application found
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            We couldn&apos;t find a tutor application for your account. If you
            just registered, please refresh in a moment.
          </p>
          <div className="mt-5">
            <ButtonLink href="/tutor/documents">Upload documents</ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  const Icon = ICON[app.status];
  const approved = app.status === "approved";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Status header */}
      <Card className="space-y-5">
        <div className="flex items-start gap-4">
          <span
            className={
              "grid h-12 w-12 shrink-0 place-items-center rounded-xl " +
              (approved
                ? "bg-success/15 text-success"
                : app.status === "rejected"
                ? "bg-destructive/15 text-destructive"
                : "bg-primary/10 text-primary")
            }
          >
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-foreground">
                Application {APPLICATION_STATUS_LABEL[app.status]}
              </h2>
              <Badge tone={APPLICATION_STATUS_TONE[app.status]}>
                {APPLICATION_STATUS_LABEL[app.status]}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {NEXT_STEPS[app.status]}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Application ID
            </p>
            <p className="mt-1 font-mono font-semibold text-foreground">
              {app.application_number}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Submitted
            </p>
            <p className="mt-1 font-semibold text-foreground">
              {fmt(app.submitted_at)}
            </p>
          </div>
        </div>
      </Card>

      {/* Admin feedback (changes requested) */}
      {app.status === "changes_requested" && (
        <Card className="space-y-4 border-warning/40 bg-warning/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" aria-hidden />
            <h3 className="font-bold text-foreground">Changes requested</h3>
          </div>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {app.admin_feedback ||
              "The admin team has asked for updates to your application."}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <ButtonLink href="/tutor/documents" variant="outline">
              Update documents
            </ButtonLink>
            <form action={resubmit}>
              <Button type="submit">Resubmit for review</Button>
            </form>
          </div>
        </Card>
      )}

      {/* Rejection reason */}
      {app.status === "rejected" && app.rejection_reason && (
        <Card className="space-y-2 border-destructive/40 bg-destructive/5">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" aria-hidden />
            <h3 className="font-bold text-foreground">Reviewer note</h3>
          </div>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {app.rejection_reason}
          </p>
        </Card>
      )}

      {/* Approved → dashboard access */}
      {approved && (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-success/40 bg-success/5">
          <div>
            <h3 className="font-bold text-foreground">
              Your Teacher Dashboard is unlocked
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up your profile, subjects and fees to start receiving leads.
            </p>
          </div>
          <ButtonLink href="/tutor">Go to dashboard</ButtonLink>
        </Card>
      )}

      {/* Email reminder */}
      {!approved && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <Mail className="h-4 w-4 shrink-0" aria-hidden />
          We&apos;ll email you at each step. Please check your registered email
          regularly.
        </div>
      )}
    </div>
  );
}
