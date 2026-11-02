import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { npr, prettyDate } from "@/lib/utils";

/** Money in (commission) and out (tutor payouts). Pull from `payments`. */
const rows = [
  ["IN", "Ramesh K. — first month", 9000, "esewa", "paid", "2026-10-30"],
  ["OUT", "Payout · Anita Sharma", 4500, "bank", "pending", "2026-10-31"],
  ["IN", "Anju M. — first month", 15000, "khalti", "paid", "2026-10-28"],
  ["IN", "Bimal R. — first month", 6000, "cash", "paid", "2026-10-27"],
] as const;

export default function Payments() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-400">
          Ledger
        </h2>
        <Button variant="outline" size="sm">Record manual payment</Button>
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-5 py-3">Dir</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Method</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map(([dir, desc, amt, method, status, date], i) => (
              <tr key={i} className="hover:bg-ink-50/60">
                <td className="px-5 py-3.5">
                  <Badge tone={dir === "IN" ? "success" : "accent"}>{dir}</Badge>
                </td>
                <td className="px-5 py-3.5 text-ink-900">{desc}</td>
                <td className="px-5 py-3.5 font-semibold text-ink-900">{npr(amt)}</td>
                <td className="px-5 py-3.5 capitalize text-ink-600">{method}</td>
                <td className="px-5 py-3.5">
                  <Badge tone={status === "paid" ? "success" : "warning"}>{status}</Badge>
                </td>
                <td className="px-5 py-3.5 text-ink-500">{prettyDate(date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
