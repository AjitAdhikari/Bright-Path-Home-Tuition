import { StatTile } from "@/components/dashboard/Shell";
import { Card, Badge } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { npr, prettyDate } from "@/lib/utils";

type PayoutRow = {
  id: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  paid_at: string | null;
  created_at: string;
};

export default async function Earnings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, amount, status, paid_at, created_at")
    .eq("direction", "payout")
    .order("created_at", { ascending: false });

  const payouts = (data ?? []) as PayoutRow[];
  const paid = payouts
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount), 0);
  const pending = payouts
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Paid out" value={npr(paid)} />
        <StatTile label="Pending" value={npr(pending)} tone="accent" />
        <StatTile label="Payouts" value={payouts.length} tone="ink" />
      </div>

      <Card>
        <h2 className="font-bold text-foreground">Payout history</h2>
        {payouts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No payouts yet. Once you teach a confirmed tuition, your share is
            released here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {payouts.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    First-month share
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {prettyDate(p.paid_at ?? p.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">
                    {npr(p.amount)}
                  </span>
                  <Badge tone={p.status === "paid" ? "success" : "warning"}>
                    <span className="capitalize">{p.status}</span>
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Bright Path collects the first month from the parent and releases your
          50% share after classes are taught. From month two, parents pay you
          directly.
        </p>
      </Card>
    </div>
  );
}
