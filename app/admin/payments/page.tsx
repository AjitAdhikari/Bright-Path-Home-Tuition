import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/Card";
import { TableCard, DataTable, type Column } from "@/components/ui/Table";
import { createClient } from "@/lib/supabase/server";
import { npr, prettyDate } from "@/lib/utils";

type PaymentRow = {
  id: string;
  direction: "in" | "payout";
  amount: number;
  method: string;
  gateway_ref: string | null;
  status: "pending" | "paid" | "failed" | "refunded";
  paid_at: string | null;
  created_at: string;
};

const STATUS_TONE: Record<
  PaymentRow["status"],
  "success" | "warning" | "danger" | "neutral"
> = {
  paid: "success",
  pending: "warning",
  failed: "danger",
  refunded: "neutral",
};

export default async function Payments() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select(
      "id, direction, amount, method, gateway_ref, status, paid_at, created_at"
    )
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as PaymentRow[];
  const paid = rows.filter((r) => r.status === "paid");
  const totalIn = paid
    .filter((r) => r.direction === "in")
    .reduce((s, r) => s + Number(r.amount), 0);
  const totalOut = paid
    .filter((r) => r.direction === "payout")
    .reduce((s, r) => s + Number(r.amount), 0);

  const columns: Column<PaymentRow>[] = [
    {
      key: "dir",
      header: "",
      className: "w-10",
      cell: (r) =>
        r.direction === "in" ? (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-success/15 text-success">
            <ArrowDownLeft className="h-4 w-4" aria-hidden />
          </span>
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-warning/20 text-warning">
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </span>
        ),
    },
    {
      key: "ref",
      header: "Reference",
      cell: (r) => (
        <div>
          <p className="font-medium text-foreground">
            {r.direction === "in" ? "Payment in" : "Tutor payout"}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {r.gateway_ref ? r.gateway_ref.slice(0, 16) : `#${r.id.slice(0, 8)}`}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (r) => (
        <span className="font-semibold text-foreground">{npr(r.amount)}</span>
      ),
    },
    {
      key: "method",
      header: "Method",
      cell: (r) => (
        <span className="capitalize text-muted-foreground">{r.method}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge tone={STATUS_TONE[r.status]}>
          <span className="capitalize">{r.status}</span>
        </Badge>
      ),
    },
    {
      key: "date",
      header: "Date",
      className: "whitespace-nowrap",
      cell: (r) => (
        <span className="text-muted-foreground">
          {prettyDate(r.paid_at ?? r.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Collected" value={npr(totalIn)} tone="success" />
        <Stat label="Paid out" value={npr(totalOut)} tone="warning" />
        <Stat label="Net held" value={npr(totalIn - totalOut)} tone="brand" />
      </div>

      <TableCard title="Ledger" subtitle={`${rows.length} transactions`}>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          empty="No payments yet. Money in and tutor payouts will show up here."
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
  value: string;
  tone: "success" | "warning" | "brand";
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "warning"
      ? "text-warning"
      : "text-primary";
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}
