import Link from "next/link";
import { Badge, StatusBadge } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import {
  CASE_STATUS,
  CASE_STATUS_LABEL,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  type CaseStatus,
  type ApplicationStatus,
} from "@/lib/constants";
import { npr, prettyDate } from "@/lib/utils";

type RequestRow = {
  id: string;
  contact_name: string;
  child_grade: string;
  status: CaseStatus;
  created_at: string;
  area: { name: string } | null;
};
type ApplicantRow = {
  id: string;
  application_number: string;
  full_name: string;
  status: ApplicationStatus;
  submitted_at: string;
};

const OPEN_APPLICATION_STATUSES = ["pending_review", "under_review", "changes_requested"];
const TZ = "Asia/Kathmandu";

export default async function AdminOverview() {
  const supabase = await createClient();

  const [
    { data: requestRows },
    { data: applicantRows, count: openAppCount },
    { count: activeCount },
    { data: paidRows },
  ] = await Promise.all([
    supabase
      .from("requests")
      .select("id, contact_name, child_grade, status, created_at, area:areas(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("tutor_applicants")
      .select("id, application_number, full_name, status, submitted_at", { count: "exact" })
      .in("status", OPEN_APPLICATION_STATUSES)
      .order("submitted_at", { ascending: false })
      .limit(6),
    supabase
      .from("tuitions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("payments")
      .select("amount, paid_at, created_at")
      .eq("direction", "in")
      .eq("status", "paid"),
  ]);

  const requests = (requestRows ?? []) as unknown as RequestRow[];
  const applicants = (applicantRows ?? []) as ApplicantRow[];

  const counts = Object.fromEntries(CASE_STATUS.map((s) => [s, 0])) as Record<CaseStatus, number>;
  for (const r of requests) counts[r.status]++;

  const toCall = requests.filter((r) => r.status === "new" || r.status === "verified");

  // Parent fees marked paid this calendar month (Nepal time).
  const month = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: TZ }).format(d);
  const thisMonth = month(new Date());
  const collected = ((paidRows ?? []) as { amount: number; paid_at: string | null; created_at: string }[])
    .filter((p) => month(new Date(p.paid_at ?? p.created_at)) === thisMonth)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date());
  const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: TZ }).format(new Date());

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{today}</p>
          <h2 className="mt-1 font-heading text-2xl font-bold text-foreground">Today at Bright Path</h2>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/requests?status=new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            New cases
          </Link>
          <Link
            href="/admin/applicants"
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Applications
          </Link>
        </div>
      </div>

      {/* Numbers */}
      <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-4">
        <Stat label="New cases" value={counts.new} note="Call these today" href="/admin/requests?status=new" />
        <Stat
          label="Applications"
          value={openAppCount ?? 0}
          note="Waiting for review"
          href="/admin/applicants"
        />
        <Stat
          label="Active tuitions"
          value={activeCount ?? 0}
          note={`${requests.length} cases in total`}
          href="/admin/requests?status=active"
        />
        <Stat label={`Collected in ${monthName}`} value={npr(collected)} note="Paid parent fees" href="/admin/payments" />
      </div>

      {/* Pipeline */}
      <section>
        <SectionHeading title="Case pipeline" link={{ href: "/admin/requests", label: "View all cases" }} />
        <ol className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-5 lg:grid-cols-9">
          {CASE_STATUS.map((s) => (
            <li key={s} className="bg-card">
              <Link
                href={`/admin/requests?status=${s}`}
                className="block h-full px-4 py-4 hover:bg-muted/50"
              >
                <span
                  className={
                    counts[s] > 0
                      ? "block text-xl font-semibold tabular-nums text-foreground"
                      : "block text-xl font-semibold tabular-nums text-muted-foreground/50"
                  }
                >
                  {counts[s]}
                </span>
                <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                  {CASE_STATUS_LABEL[s]}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Queues */}
      <div className="grid gap-10 xl:grid-cols-2 xl:gap-8">
        <section>
          <SectionHeading
            title={`Waiting for a call (${toCall.length})`}
            link={{ href: "/admin/requests?status=new", label: "Open cases" }}
          />
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            {toCall.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">No one is waiting for a call.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2.5 pl-5 pr-3 font-medium">Parent</th>
                    <th className="py-2.5 pr-3 font-medium">Grade</th>
                    <th className="hidden py-2.5 pr-3 font-medium sm:table-cell">Received</th>
                    <th className="py-2.5 pr-5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {toCall.slice(0, 6).map((r) => (
                    <tr key={r.id} className="hover:bg-muted/40">
                      <td className="py-3 pl-5 pr-3">
                        <Link href={`/admin/requests/${r.id}`} className="font-medium text-foreground hover:underline">
                          {r.contact_name}
                        </Link>
                        {r.area?.name && <p className="text-xs text-muted-foreground">{r.area.name}</p>}
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">{r.child_grade}</td>
                      <td className="hidden whitespace-nowrap py-3 pr-3 text-muted-foreground sm:table-cell">
                        {prettyDate(r.created_at)}
                      </td>
                      <td className="py-3 pr-5">
                        <StatusBadge status={r.status} label={CASE_STATUS_LABEL[r.status]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section>
          <SectionHeading
            title={`Tutor applications (${openAppCount ?? 0})`}
            link={{ href: "/admin/applicants", label: "Review all" }}
          />
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            {applicants.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">No applications to review.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2.5 pl-5 pr-3 font-medium">Name</th>
                    <th className="hidden py-2.5 pr-3 font-medium sm:table-cell">Submitted</th>
                    <th className="py-2.5 pr-5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {applicants.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/40">
                      <td className="py-3 pl-5 pr-3">
                        <Link href={`/admin/applicants/${a.id}`} className="font-medium text-foreground hover:underline">
                          {a.full_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{a.application_number}</p>
                      </td>
                      <td className="hidden whitespace-nowrap py-3 pr-3 text-muted-foreground sm:table-cell">
                        {prettyDate(a.submitted_at)}
                      </td>
                      <td className="py-3 pr-5">
                        <Badge tone={APPLICATION_STATUS_TONE[a.status]}>{APPLICATION_STATUS_LABEL[a.status]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  href,
}: {
  label: string;
  value: string | number;
  note: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="border-border p-5 hover:bg-muted/40 sm:p-6 [&:nth-child(odd)]:border-r [&:nth-child(-n+2)]:border-b lg:border-r lg:[&:nth-child(-n+2)]:border-b-0 lg:last:border-r-0"
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 truncate text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </Link>
  );
}

function SectionHeading({ title, link }: { title: string; link: { href: string; label: string } }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <Link href={link.href} className="text-sm text-secondary hover:underline">
        {link.label}
      </Link>
    </div>
  );
}
