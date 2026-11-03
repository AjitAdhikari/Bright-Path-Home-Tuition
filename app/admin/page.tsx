import { PhoneCall, BookOpen, UserCheck, FolderOpen } from "lucide-react";
import { StatTile } from "@/components/dashboard/Shell";
import { Card, Badge, StatusBadge } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { CASE_STATUS, CASE_STATUS_LABEL, type CaseStatus } from "@/lib/constants";

type RequestRow = {
  id: string;
  contact_name: string;
  child_grade: string;
  status: string;
};
type PendingTutor = {
  user_id: string;
  education: string | null;
  profiles: { full_name: string } | null;
};

export default async function AdminOverview() {
  const supabase = await createClient();

  const [{ data: rows }, { data: pendingRows }, { count: activeCount }] =
    await Promise.all([
      supabase.from("requests").select("id, contact_name, child_grade, status"),
      supabase
        .from("tutor_profiles")
        .select("user_id, education, profiles(full_name)")
        .eq("verification_status", "pending")
        .limit(6),
      supabase
        .from("tuitions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
    ]);

  const requests = (rows ?? []) as RequestRow[];
  const tutorsToApprove = (pendingRows ?? []) as PendingTutor[];
  const counts = Object.fromEntries(CASE_STATUS.map((s) => [s, 0])) as Record<
    CaseStatus,
    number
  >;
  for (const r of requests) counts[r.status as CaseStatus]++;

  const needsCall = requests.filter((r) =>
    ["new", "verified"].includes(r.status)
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="New"
          value={counts.new}
          sub="call within the day"
          icon={PhoneCall}
          tone="accent"
        />
        <StatTile
          label="Active tuitions"
          value={activeCount ?? 0}
          sub="classes running"
          icon={BookOpen}
        />
        <StatTile
          label="Awaiting approval"
          value={tutorsToApprove?.length ?? 0}
          icon={UserCheck}
          tone="ink"
        />
        <StatTile label="Total cases" value={requests.length} icon={FolderOpen} />
      </div>

      {/* Case pipeline */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Case pipeline
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
          {CASE_STATUS.map((s) => (
            <a
              key={s}
              href={`/admin/requests?status=${s}`}
              className="rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary"
            >
              <p className="text-2xl font-bold text-foreground">{counts[s]}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {CASE_STATUS_LABEL[s]}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* Tutors awaiting approval */}
      {tutorsToApprove && tutorsToApprove.length > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground">Tutors awaiting approval</h2>
            <ButtonLink href="/admin/tutors" variant="ghost" size="sm">
              Review all
            </ButtonLink>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {tutorsToApprove.map((t) => {
              const name =
                (t.profiles as { full_name: string } | null)?.full_name ??
                "New tutor";
              return (
                <li
                  key={t.user_id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-semibold text-foreground">{name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.education ?? "Awaiting document review"}
                    </p>
                  </div>
                  <Badge tone="warning">Pending</Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Needs a call */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground">Needs a call</h2>
          <Badge tone="accent">{needsCall.length} waiting</Badge>
        </div>
        {needsCall.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            All caught up — no new cases waiting for a first call.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {needsCall.slice(0, 8).map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {r.contact_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {r.child_grade}
                  </p>
                </div>
                <StatusBadge
                  status={r.status as CaseStatus}
                  label={CASE_STATUS_LABEL[r.status as CaseStatus]}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
