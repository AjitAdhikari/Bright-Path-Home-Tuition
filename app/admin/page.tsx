import { StatTile } from "@/components/dashboard/Shell";
import { Card, Badge } from "@/components/ui/Card";
import { CASE_STATUS, CASE_STATUS_LABEL } from "@/lib/constants";
import { npr } from "@/lib/utils";

/**
 * Admin overview. In production the counts come from a grouped query on
 * `requests.status`; shown here with representative values so the layout and
 * the status pipeline are clear from day one.
 */
const counts: Record<string, number> = {
  new: 6,
  verified: 4,
  tutors_shared: 9,
  demo_scheduled: 5,
  demo_done: 3,
  confirmed: 2,
  active: 41,
  replacement: 1,
  closed: 18,
};

const toReview = [
  ["Ramesh K.", "SEE · Maths, Science", "Baneshwor", "new"],
  ["Pooja T.", "+2 Science · Physics", "Kirtipur", "new"],
  ["Hari B.", "Class 6–8 · English", "Patan", "verified"],
];

export default function AdminOverview() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="New today" value={counts.new} sub="call within the day" tone="accent" />
        <StatTile label="Active tuitions" value={counts.active} sub="classes running" />
        <StatTile label="Confirmed this week" value={counts.confirmed} tone="ink" />
        <StatTile label="Commission (month)" value={npr(164000)} sub="collected" />
      </div>

      {/* Case pipeline */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-400">
          Case pipeline
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
          {CASE_STATUS.map((s) => (
            <a
              key={s}
              href={`/admin/requests?status=${s}`}
              className="rounded-xl border border-ink-200 bg-card p-3 transition-colors hover:border-brand-400"
            >
              <p className="text-2xl font-bold text-ink-900">{counts[s] ?? 0}</p>
              <p className="mt-1 text-xs text-ink-500">{CASE_STATUS_LABEL[s]}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Needs attention */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink-900">Needs a call</h2>
          <Badge tone="accent">{toReview.length} waiting</Badge>
        </div>
        <ul className="mt-4 divide-y divide-ink-100">
          {toReview.map(([name, need, area, status]) => (
            <li key={name} className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold text-ink-900">{name}</p>
                <p className="text-sm text-ink-500">
                  {need} · {area}
                </p>
              </div>
              <Badge tone={status === "new" ? "warning" : "brand"}>
                {CASE_STATUS_LABEL[status as keyof typeof CASE_STATUS_LABEL]}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
