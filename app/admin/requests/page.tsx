import Link from "next/link";
import { StatusBadge } from "@/components/ui/Card";
import { TableCard, DataTable, type Column } from "@/components/ui/Table";
import { createClient } from "@/lib/supabase/server";
import {
  CASE_STATUS,
  CASE_STATUS_LABEL,
  type CaseStatus,
} from "@/lib/constants";
import { npr, prettyDate } from "@/lib/utils";

type CaseRow = {
  id: string;
  contact_name: string;
  child_grade: string;
  board: string | null;
  budget: number | null;
  status: CaseStatus;
  created_at: string;
  area: { name: string } | null;
};

export default async function AdminRequests({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: active } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("requests")
    .select(
      "id, contact_name, child_grade, board, budget, status, created_at, area:areas(name)"
    )
    .order("created_at", { ascending: false });

  if (active && CASE_STATUS.includes(active as CaseStatus)) {
    query = query.eq("status", active);
  }

  const { data } = await query;
  const rows = (data ?? []) as CaseRow[];

  const columns: Column<CaseRow>[] = [
    {
      key: "case",
      header: "Case",
      cell: (r) => (
        <Link
          href={`/admin/requests/${r.id}`}
          className="font-semibold text-primary hover:underline"
        >
          #{r.id.slice(0, 8)}
        </Link>
      ),
    },
    {
      key: "parent",
      header: "Parent",
      cell: (r) => (
        <span className="font-medium text-foreground">{r.contact_name}</span>
      ),
    },
    {
      key: "need",
      header: "Need",
      cell: (r) => (
        <span className="text-muted-foreground">
          {r.child_grade}
          {r.board ? ` · ${r.board}` : ""}
        </span>
      ),
    },
    {
      key: "area",
      header: "Area",
      cell: (r) => (
        <span className="text-muted-foreground">{r.area?.name ?? "—"}</span>
      ),
    },
    {
      key: "budget",
      header: "Budget",
      cell: (r) => (
        <span className="text-foreground">
          {r.budget ? npr(r.budget) : "—"}
        </span>
      ),
    },
    {
      key: "date",
      header: "Posted",
      className: "whitespace-nowrap",
      cell: (r) => (
        <span className="text-muted-foreground">{prettyDate(r.created_at)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <StatusBadge status={r.status} label={CASE_STATUS_LABEL[r.status]} />
      ),
    },
  ];

  const chip =
    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors";

  return (
    <div className="space-y-6">
      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/requests"
          className={`${chip} ${
            !active
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:border-primary/50"
          }`}
        >
          All
        </Link>
        {CASE_STATUS.map((s) => (
          <Link
            key={s}
            href={`/admin/requests?status=${s}`}
            className={`${chip} ${
              active === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            }`}
          >
            {CASE_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <TableCard
        title="Cases"
        subtitle={`${rows.length} ${rows.length === 1 ? "case" : "cases"}${
          active ? ` · ${CASE_STATUS_LABEL[active as CaseStatus]}` : ""
        }`}
      >
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          empty={
            active
              ? "No cases with this status yet."
              : "No cases yet. New parent requests will appear here."
          }
        />
      </TableCard>
    </div>
  );
}
