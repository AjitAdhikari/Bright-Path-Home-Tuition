import { Badge } from "@/components/ui/Card";
import { TableCard, DataTable, type Column } from "@/components/ui/Table";
import { createClient } from "@/lib/supabase/server";
import { npr, prettyDate } from "@/lib/utils";

type TuitionRow = {
  id: string;
  monthly_fee: number;
  status: "active" | "ended";
  start_date: string | null;
  match: {
    request: {
      child_grade: string;
      contact_name: string;
      area: { name: string } | null;
    } | null;
  } | null;
};

export default async function Tuitions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tuitions")
    .select(
      "id, monthly_fee, status, start_date, match:matches(request:requests(child_grade, contact_name, area:areas(name)))"
    )
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as TuitionRow[];

  const columns: Column<TuitionRow>[] = [
    {
      key: "student",
      header: "Student",
      cell: (t) => (
        <div>
          <p className="font-semibold text-foreground">
            {t.match?.request?.contact_name ?? "Student"}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.match?.request?.child_grade ?? "—"}
          </p>
        </div>
      ),
    },
    {
      key: "area",
      header: "Area",
      cell: (t) => (
        <span className="text-muted-foreground">
          {t.match?.request?.area?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "fee",
      header: "Fee",
      cell: (t) => (
        <span className="font-semibold text-foreground">
          {npr(t.monthly_fee)}/mo
        </span>
      ),
    },
    {
      key: "since",
      header: "Since",
      className: "whitespace-nowrap",
      cell: (t) => (
        <span className="text-muted-foreground">
          {t.start_date ? prettyDate(t.start_date) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (t) => (
        <Badge tone={t.status === "active" ? "success" : "neutral"}>
          <span className="capitalize">{t.status}</span>
        </Badge>
      ),
    },
  ];

  return (
    <TableCard title="My tuitions" subtitle={`${rows.length} total`}>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        empty="No tuitions yet. Accepted leads that become regular classes show up here."
      />
    </TableCard>
  );
}
