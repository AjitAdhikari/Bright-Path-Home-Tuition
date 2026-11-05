import { createClient } from "@/lib/supabase/server";
import { Figures } from "@/components/dashboard/Figures";
import { npr, prettyDate } from "@/lib/utils";
import { loadTutorWork, describeRequest, ktmDay, type Tuition } from "../data";

export default async function Tuitions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { tuitions } = await loadTutorWork(supabase, user?.id ?? "");
  const active = tuitions.filter((t) => t.status === "active");
  const ended = tuitions.filter((t) => t.status === "ended");

  // Attendance for this month and overall, per tuition.
  const monthStart = ktmDay().slice(0, 8) + "01";
  const { data: rows } = tuitions.length
    ? await supabase
        .from("attendance")
        .select("tuition_id, class_date, status")
        .in("tuition_id", tuitions.map((t) => t.id))
    : { data: [] };
  const attendance = (rows ?? []) as { tuition_id: string; class_date: string; status: string }[];

  const stats = new Map<string, { month: number; total: number; last: string | null }>();
  for (const t of tuitions) stats.set(t.id, { month: 0, total: 0, last: null });
  for (const a of attendance) {
    if (a.status !== "held") continue;
    const s = stats.get(a.tuition_id);
    if (!s) continue;
    s.total++;
    if (a.class_date >= monthStart) s.month++;
    if (!s.last || a.class_date > s.last) s.last = a.class_date;
  }

  const monthClasses = [...stats.values()].reduce((t, s) => t + s.month, 0);

  return (
    <div className="space-y-10">
      <Figures
        items={[
          { label: "Active students", value: active.length, note: `${ended.length} finished` },
          {
            label: "Fees each month",
            value: npr(active.reduce((t, x) => t + x.monthlyFee, 0)),
            note: "Across active students",
          },
          { label: "Classes this month", value: monthClasses, note: "Marked as held" },
        ]}
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Teaching now</h2>
        <StudentList
          rows={active}
          stats={stats}
          empty="No regular classes yet. Once a parent chooses you after a demo class, the tuition shows up here."
        />
      </section>

      {ended.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Finished</h2>
          <StudentList rows={ended} stats={stats} empty="" muted />
        </section>
      )}
    </div>
  );
}

function StudentList({
  rows,
  stats,
  empty,
  muted,
}: {
  rows: Tuition[];
  stats: Map<string, { month: number; total: number; last: string | null }>;
  empty: string;
  muted?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-5 py-8 text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="py-2.5 pl-5 pr-3 font-medium">Student</th>
            <th className="hidden py-2.5 pr-3 font-medium sm:table-cell">Started</th>
            <th className="py-2.5 pr-3 text-right font-medium">This month</th>
            <th className="hidden py-2.5 pr-3 font-medium md:table-cell">Last class</th>
            <th className="py-2.5 pr-5 text-right font-medium">Fee</th>
          </tr>
        </thead>
        <tbody className={muted ? "divide-y divide-border text-muted-foreground" : "divide-y divide-border"}>
          {rows.map((t) => {
            const d = describeRequest(t.request);
            const s = stats.get(t.id)!;
            return (
              <tr key={t.id}>
                <td className="py-3 pl-5 pr-3">
                  <p className={muted ? "font-medium" : "font-medium text-foreground"}>{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.detail}</p>
                </td>
                <td className="hidden whitespace-nowrap py-3 pr-3 text-muted-foreground sm:table-cell">
                  {t.startDate ? prettyDate(t.startDate) : "—"}
                </td>
                <td className="py-3 pr-3 text-right tabular-nums">
                  {s.month}
                  <span className="text-xs text-muted-foreground"> / {s.total} total</span>
                </td>
                <td className="hidden whitespace-nowrap py-3 pr-3 text-muted-foreground md:table-cell">
                  {s.last ? prettyDate(s.last) : "—"}
                </td>
                <td className="whitespace-nowrap py-3 pr-5 text-right font-semibold tabular-nums">
                  {npr(t.monthlyFee)}
                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
