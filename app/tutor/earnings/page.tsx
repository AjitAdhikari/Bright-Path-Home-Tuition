import { StatTile } from "@/components/dashboard/Shell";
import { Card, Badge } from "@/components/ui/Card";
import { npr, prettyDate } from "@/lib/utils";

const payouts = [
  ["First month share · Ramesh K.", 4500, "paid", "2026-10-30"],
  ["First month share · Sita G.", 3500, "pending", "2026-10-31"],
] as const;

export default function Earnings() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="This month" value={npr(8000)} />
        <StatTile label="Pending" value={npr(3500)} tone="accent" />
        <StatTile label="All time" value={npr(142000)} tone="ink" />
      </div>
      <Card>
        <h2 className="font-bold text-ink-900">Payout history</h2>
        <ul className="mt-4 divide-y divide-ink-100">
          {payouts.map(([desc, amt, status, date]) => (
            <li key={desc} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-ink-900">{desc}</p>
                <p className="text-xs text-ink-400">{prettyDate(date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-ink-900">{npr(amt)}</span>
                <Badge tone={status === "paid" ? "success" : "warning"}>{status}</Badge>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-ink-400">
          Bright Path collects the first month from the parent and releases your 50%
          share after classes are taught. From month two, parents pay you directly.
        </p>
      </Card>
    </div>
  );
}
