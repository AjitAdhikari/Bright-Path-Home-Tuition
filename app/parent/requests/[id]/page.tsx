import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { MatchList } from "@/components/tutors/MatchCard";
import { createClient } from "@/lib/supabase/server";
import { CASE_STATUS_LABEL, type CaseStatus } from "@/lib/constants";
import type { MatchedTutor } from "@/app/(public)/find-tutor/actions";
import { notFound } from "next/navigation";

export default async function ParentRequestDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Typed loosely until `npm run db:types` regenerates database.types.ts.
  type RequestRow = {
    id: string;
    child_grade: string;
    board: string | null;
    status: CaseStatus;
    request_subjects: Array<{ subjects: { name: string } | null }> | null;
  };

  const { data } = await supabase
    .from("requests")
    .select("id, child_grade, board, status, request_subjects(subjects(name))")
    .eq("id", id)
    .maybeSingle();
  const request = data as RequestRow | null;

  if (!request) notFound();

  const { data: matchData } = await supabase.rpc("match_tutors" as never, {
    p_request: id,
  } as never);
  const matches = (matchData ?? []) as MatchedTutor[];

  const subjects = (request.request_subjects ?? [])
    .map((r) => r.subjects?.name)
    .filter(Boolean)
    .join(", ");
  const status = request.status as CaseStatus;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink-500">Request #{id.slice(0, 8)}</p>
            <h2 className="text-lg font-bold text-ink-900">
              {request.child_grade}
              {subjects && ` · ${subjects}`}
            </h2>
          </div>
          <StatusBadge status={status} label={CASE_STATUS_LABEL[status]} />
        </div>
        <p className="mt-3 text-sm text-ink-600">
          {matches.length > 0
            ? "These verified tutors match your requirement. Book a free demo with one — you only pay the first month after you confirm."
            : "We're hand-picking verified tutors for you and will call shortly. New verified tutors are added every week."}
        </p>
      </Card>

      <div>
        <h3 className="mb-4 text-lg font-bold text-ink-900">
          Matched tutors{matches.length > 0 && ` (${matches.length})`}
        </h3>
        <MatchList matches={matches} />
      </div>

      <Card className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-ink-600">
          Already had your demo and happy with a tutor?
        </p>
        <ButtonLink href="#" variant="accent">
          Confirm &amp; pay first month
        </ButtonLink>
        <button className="text-sm text-ink-500 hover:text-ink-900">
          Request a different tutor
        </button>
      </Card>
    </div>
  );
}
