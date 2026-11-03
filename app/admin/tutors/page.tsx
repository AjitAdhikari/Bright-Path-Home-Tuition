import { Badge } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TableCard, DataTable, type Column } from "@/components/ui/Table";
import { createClient } from "@/lib/supabase/server";
import type { VerificationStatus } from "@/lib/constants";
import { setTutorStatus } from "./actions";

type TutorRow = {
  user_id: string;
  education: string | null;
  experience_years: number | null;
  verification_status: VerificationStatus;
  rating_avg: number | null;
  profiles: { full_name: string } | null;
};

const STATUS_TONE: Record<
  VerificationStatus,
  "warning" | "success" | "neutral" | "danger"
> = {
  pending: "warning",
  needs_info: "warning",
  approved: "success",
  rejected: "danger",
};

const STATUS_LABEL: Record<VerificationStatus, string> = {
  pending: "Pending",
  needs_info: "Needs info",
  approved: "Approved",
  rejected: "Rejected",
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default async function TutorApprovals() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tutor_profiles")
    .select(
      "user_id, education, experience_years, verification_status, rating_avg, profiles(full_name)"
    )
    .order("created_at", { ascending: false });

  const tutors = (data ?? []) as TutorRow[];
  const pending = tutors.filter((t) =>
    ["pending", "needs_info"].includes(t.verification_status)
  );

  const columns: Column<TutorRow>[] = [
    {
      key: "tutor",
      header: "Tutor",
      cell: (t) => {
        const name = t.profiles?.full_name ?? "New tutor";
        return (
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {initials(name)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {t.education ?? "Awaiting details"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "experience",
      header: "Experience",
      cell: (t) => (
        <span className="text-muted-foreground">
          {t.experience_years ? `${t.experience_years} yrs` : "—"}
        </span>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      cell: (t) =>
        t.rating_avg && t.rating_avg > 0 ? (
          <span className="font-medium text-foreground">
            {Number(t.rating_avg).toFixed(1)}★
          </span>
        ) : (
          <span className="text-muted-foreground">New</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (t) => (
        <Badge tone={STATUS_TONE[t.verification_status]}>
          {STATUS_LABEL[t.verification_status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right whitespace-nowrap",
      cell: (t) => (
        <div className="flex justify-end gap-2">
          <ButtonLink href={`/admin/tutors/${t.user_id}`} variant="ghost" size="sm">
            View
          </ButtonLink>
          {t.verification_status !== "approved" && (
            <form action={setTutorStatus}>
              <input type="hidden" name="user_id" value={t.user_id} />
              <input type="hidden" name="status" value="approved" />
              <Button type="submit" size="sm">
                Approve
              </Button>
            </form>
          )}
          {t.verification_status === "approved" && (
            <form action={setTutorStatus}>
              <input type="hidden" name="user_id" value={t.user_id} />
              <input type="hidden" name="status" value="needs_info" />
              <Button type="submit" variant="ghost" size="sm">
                Suspend
              </Button>
            </form>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Awaiting approval" value={pending.length} tone="warning" />
        <Stat
          label="Approved"
          value={tutors.filter((t) => t.verification_status === "approved").length}
          tone="success"
        />
        <Stat label="Total tutors" value={tutors.length} tone="muted" />
      </div>

      <TableCard title="Tutors" subtitle={`${tutors.length} total`}>
        <DataTable
          columns={columns}
          rows={tutors}
          rowKey={(t) => t.user_id}
          empty="No tutor applications yet."
        />
      </TableCard>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "success" | "muted";
}) {
  const color =
    tone === "warning"
      ? "text-warning"
      : tone === "success"
      ? "text-success"
      : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}
