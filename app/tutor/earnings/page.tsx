import { Figures } from "@/components/dashboard/Figures";
import { Badge } from "@/components/ui/Card";
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
    <div className="space-y-10">
      <Figures
        items={[
          { label: "Paid out", value: npr(paid), note: "Released to you so far" },
          { label: "Pending", value: npr(pending), note: "Waiting for classes to finish" },
          { label: "Payouts", value: payouts.length, note: "In total" },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Payout history</h2>
          <div className="rounded-lg border border-border bg-card">
            {payouts.length === 0 ? (
              <div className="px-5 py-8">
                <p className="text-sm font-medium text-foreground">No payouts yet.</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Once you teach a confirmed tuition, your share of the first month is
                  released here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {payouts.map((p) => (
                  <li key={p.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">First-month share</p>
                      <p className="text-xs text-muted-foreground">
                        {prettyDate(p.paid_at ?? p.created_at)}
                      </p>
                    </div>
                    <Badge tone={p.status === "paid" ? "success" : "warning"}>
                      <span className="capitalize">{p.status}</span>
                    </Badge>
                    <span className="w-24 text-right font-semibold tabular-nums text-foreground">
                      {npr(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="text-sm">
          <h3 className="mb-3 font-semibold text-foreground">How payouts work</h3>
          <ol className="space-y-3 border-l border-border pl-4 text-muted-foreground">
            <li>Bright Path collects the first month&apos;s fee from the parent.</li>
            <li>After the classes are taught, we release your 50% share.</li>
            <li>From month two, parents pay you directly.</li>
          </ol>
        </aside>
      </div>
    </div>
  );
}
