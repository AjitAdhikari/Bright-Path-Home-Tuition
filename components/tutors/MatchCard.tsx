import { Card, Badge } from "@/components/ui/Card";
import { npr } from "@/lib/utils";
import type { MatchedTutor } from "@/app/(public)/find-tutor/actions";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function MatchCard({ tutor }: { tutor: MatchedTutor }) {
  return (
    <Card className="flex flex-col gap-4 transition-shadow hover:shadow-lift">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-100 text-base font-bold text-brand-700">
          {initials(tutor.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-bold text-ink-900">{tutor.full_name}</p>
            <Badge tone="brand">✓ Verified</Badge>
          </div>
          <p className="mt-0.5 text-sm text-ink-600">
            {tutor.education || "Experienced home tutor"}
            {tutor.experience_years > 0 &&
              ` · ${tutor.experience_years} yrs experience`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tutor.subjects.map((s) => (
          <span
            key={s}
            className="rounded-[6px] bg-ink-100 px-2 py-0.5 text-[13px] font-semibold text-ink-700"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-ink-200 pt-4 text-sm">
        <span className="font-semibold text-ink-900">
          {tutor.rating_avg > 0 ? `${tutor.rating_avg.toFixed(1)}★` : "New tutor"}
        </span>
        <span className="text-ink-600">
          from <strong className="text-ink-900">{npr(tutor.from_fee)}</strong>
          /mo
        </span>
        {tutor.teaches_online && <Badge tone="accent">Online</Badge>}
      </div>
    </Card>
  );
}

export function MatchList({ matches }: { matches: MatchedTutor[] }) {
  if (!matches.length) {
    return (
      <Card className="text-center">
        <p className="font-semibold text-ink-900">
          No verified tutors match yet
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-600">
          Don&apos;t worry — a real person will hand-pick tutors for you and
          call within a few hours. We add new verified tutors every week.
        </p>
      </Card>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {matches.map((t) => (
        <MatchCard key={t.user_id} tutor={t} />
      ))}
    </div>
  );
}
