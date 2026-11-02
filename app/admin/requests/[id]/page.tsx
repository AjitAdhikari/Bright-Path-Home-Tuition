import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CASE_STATUS, CASE_STATUS_LABEL } from "@/lib/constants";
import { npr } from "@/lib/utils";

/** Case detail: match tutors, add notes, move status. Values are illustrative. */
export default async function CaseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const candidates = [
    ["Anita Sharma", "Maths, Science", "6 yrs", 4.9, 8000],
    ["Bikash Thapa", "Maths", "3 yrs", 4.6, 7000],
    ["Sabina Rai", "Science", "5 yrs", 4.8, 8500],
  ] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-400">Case #{id}</p>
              <h2 className="text-xl font-bold text-ink-900">Ramesh K.</h2>
              <p className="mt-1 text-sm text-ink-600">
                SEE · Maths, Science · Home tuition
              </p>
            </div>
            <Badge tone="warning">New</Badge>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <Detail k="Phone" v="98•• ••• ••• (revealed on confirm)" />
            <Detail k="Area" v="Baneshwor, KTM" />
            <Detail k="Budget" v={npr(9000)} />
            <Detail k="Preferred" v="Evenings · Any gender" />
          </dl>
        </Card>

        <Card>
          <h3 className="font-bold text-ink-900">Shortlist tutors</h3>
          <p className="mt-1 text-sm text-ink-500">
            Pick 2–3 to share with the parent.
          </p>
          <ul className="mt-4 space-y-3">
            {candidates.map(([name, subj, exp, rating, fee]) => (
              <li
                key={name}
                className="flex items-center justify-between rounded-xl border border-ink-200 p-3"
              >
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="h-4 w-4 accent-[var(--color-brand-600)]" />
                  <div>
                    <p className="font-semibold text-ink-900">{name}</p>
                    <p className="text-xs text-ink-500">
                      {subj} · {exp} · ⭐ {rating} · {npr(fee)}
                    </p>
                  </div>
                </div>
                <Badge tone="success">Verified</Badge>
              </li>
            ))}
          </ul>
          <Button className="mt-4">Share selected with parent</Button>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <h3 className="font-bold text-ink-900">Move status</h3>
          <select className="mt-3 w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm">
            {CASE_STATUS.map((s) => (
              <option key={s}>{CASE_STATUS_LABEL[s]}</option>
            ))}
          </select>
          <Button variant="outline" className="mt-3 w-full">Update</Button>
        </Card>

        <Card>
          <h3 className="font-bold text-ink-900">Call notes</h3>
          <textarea
            className="mt-3 min-h-28 w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm"
            placeholder="What did the parent say?"
          />
          <Button variant="outline" className="mt-3 w-full">Add note</Button>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="rounded-xl bg-ink-50 p-3">
              <p className="text-ink-700">Confirmed budget, prefers female tutor after all.</p>
              <p className="mt-1 text-xs text-ink-400">You · 31 Oct, 11:20</p>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-ink-400">{k}</dt>
      <dd className="font-medium text-ink-900">{v}</dd>
    </div>
  );
}
