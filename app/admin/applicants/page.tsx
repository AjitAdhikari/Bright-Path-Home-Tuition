import { Badge } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { TableCard, DataTable, type Column } from "@/components/ui/Table";
import { createClient } from "@/lib/supabase/server";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  type ApplicationStatus,
} from "@/lib/constants";

type Row = {
  id: string;
  application_number: string;
  full_name: string;
  email: string;
  phone: string | null;
  education: string | null;
  experience_years: number | null;
  status: ApplicationStatus;
  submitted_at: string | null;
};

function prettyDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ApplicantsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tutor_applicants")
    .select(
      "id, application_number, full_name, email, phone, education, experience_years, status, submitted_at"
    )
    .order("submitted_at", { ascending: false });

  const rows = (data ?? []) as Row[];
  const count = (s: ApplicationStatus) => rows.filter((r) => r.status === s).length;

  const stats: { label: string; value: number; tone: string }[] = [
    { label: "Total", value: rows.length, tone: "text-foreground" },
    { label: "Pending review", value: count("pending_review"), tone: "text-warning" },
    { label: "Changes requested", value: count("changes_requested"), tone: "text-warning" },
    { label: "Approved", value: count("approved"), tone: "text-success" },
  ];

  const columns: Column<Row>[] = [
    {
      key: "applicant",
      header: "Applicant",
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{r.full_name}</p>
          <p className="truncate text-xs text-muted-foreground">{r.email}</p>
        </div>
      ),
    },
    {
      key: "number",
      header: "Application",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {r.application_number}
        </span>
      ),
    },
    {
      key: "education",
      header: "Education",
      cell: (r) => (
        <span className="text-muted-foreground">{r.education ?? "—"}</span>
      ),
    },
    {
      key: "submitted",
      header: "Submitted",
      cell: (r) => (
        <span className="text-muted-foreground">{prettyDate(r.submitted_at)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge tone={APPLICATION_STATUS_TONE[r.status]}>
          {APPLICATION_STATUS_LABEL[r.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right whitespace-nowrap",
      cell: (r) => (
        <ButtonLink href={`/admin/applicants/${r.id}`} size="sm">
          Review
        </ButtonLink>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-5 shadow-soft"
          >
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-3xl font-extrabold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <TableCard title="Tutor applications" subtitle={`${rows.length} total`}>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          empty="No tutor applications yet."
        />
      </TableCard>
    </div>
  );
}
