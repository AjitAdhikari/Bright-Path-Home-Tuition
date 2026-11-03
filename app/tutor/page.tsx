import { CheckCircle2, AlertTriangle, Clock, Inbox, Star, BadgeCheck } from "lucide-react";
import { Card, Badge } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { StatTile } from "@/components/dashboard/Shell";
import { createClient } from "@/lib/supabase/server";
import type { VerificationStatus } from "@/lib/constants";

export default async function TutorHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileRow } = await supabase
    .from("tutor_profiles")
    .select("verification_status, rating_avg")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  // Leads a parent (or admin) has shared with this tutor, not yet answered.
  const { data: leadRows } = await supabase
    .from("matches")
    .select("id, status, request:requests(child_grade, board)")
    .eq("status", "shared");

  const profile = profileRow as
    | { verification_status: string; rating_avg: number }
    | null;
  const leads = (leadRows ?? []) as {
    id: string;
    status: string;
    request: { child_grade: string; board: string | null } | null;
  }[];

  const status = (profile?.verification_status ??
    "pending") as VerificationStatus;
  const rating = Number(profile?.rating_avg ?? 0);

  return (
    <div className="space-y-8">
      <VerificationBanner status={status} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Shared leads" value={leads?.length ?? 0} icon={Inbox} />
        <StatTile
          label="Rating"
          value={rating > 0 ? `${rating.toFixed(1)}★` : "—"}
          sub={rating > 0 ? "from parent reviews" : "no reviews yet"}
          icon={Star}
          tone="accent"
        />
        <StatTile
          label="Status"
          value={status === "approved" ? "Verified" : "In review"}
          icon={BadgeCheck}
          tone="ink"
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Leads shared with you
          </h2>
          {leads && leads.length > 0 && (
            <Badge tone="accent">{leads.length} new</Badge>
          )}
        </div>

        {!leads || leads.length === 0 ? (
          <Card className="text-center text-sm text-muted-foreground">
            No leads yet. When our team shares a matching request with you,
            it&apos;ll show up here.
          </Card>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => {
              const req = lead.request as { child_grade: string; board: string | null } | null;
              return (
                <Card
                  key={lead.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="font-semibold text-foreground">
                    {req?.child_grade ?? "Tuition request"}
                    {req?.board ? ` · ${req.board}` : ""}
                  </p>
                  <ButtonLink href="/tutor/tuitions" size="sm">
                    View
                  </ButtonLink>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function VerificationBanner({ status }: { status: VerificationStatus }) {
  if (status === "approved") {
    return (
      <Card className="flex items-center gap-4 border-success/30 bg-success/10">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-success" aria-hidden />
        <div>
          <p className="font-semibold text-success">
            You&apos;re verified and visible to parents
          </p>
          <p className="text-sm text-muted-foreground">
            Keep your subjects and availability current to get more leads.
          </p>
        </div>
      </Card>
    );
  }
  if (status === "needs_info") {
    return (
      <Card className="flex items-center justify-between gap-4 border-warning/40 bg-warning/10">
        <div className="flex items-center gap-4">
          <AlertTriangle className="h-6 w-6 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="font-semibold text-foreground">We need a bit more</p>
            <p className="text-sm text-muted-foreground">
              Please upload your latest certificate to finish verification.
            </p>
          </div>
        </div>
        <ButtonLink href="/tutor/documents" size="sm">
          Upload
        </ButtonLink>
      </Card>
    );
  }
  return (
    <Card className="flex items-center gap-4 border-primary/30 bg-primary/10">
      <Clock className="h-6 w-6 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="font-semibold text-foreground">Verification in progress</p>
        <p className="text-sm text-muted-foreground">
          We&apos;re reviewing your documents and will call you for a short
          interview before you go live.
        </p>
      </div>
    </Card>
  );
}
