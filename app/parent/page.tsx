import Link from "next/link";
import { Card, Badge, StatusBadge } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { CASE_STATUS_LABEL, type CaseStatus } from "@/lib/constants";
import { prettyDate } from "@/lib/utils";

const activeish: CaseStatus[] = ["confirmed", "active"];

export default async function ParentHome() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("requests")
    .select("id, child_grade, board, status, created_at")
    .order("created_at", { ascending: false });

  const requests = (rows ?? []) as {
    id: string;
    child_grade: string;
    board: string | null;
    status: string;
    created_at: string;
  }[];

  if (requests.length === 0) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="text-lg font-semibold text-foreground">
          No requests yet
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Tell us what your child needs and we&apos;ll call you with 2–3
          verified tutors — usually the same day.
        </p>
        <ButtonLink href="/find-tutor" className="mt-5">
          Find a tutor
        </ButtonLink>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => {
        const status = r.status as CaseStatus;
        return (
          <Link key={r.id} href={`/parent/requests/${r.id}`} className="block">
            <Card className="flex items-center justify-between gap-4 transition-shadow hover:shadow-card">
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {r.child_grade}
                  {r.board ? ` · ${r.board}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  Posted {prettyDate(r.created_at)}
                </p>
              </div>
              {activeish.includes(status) ? (
                <Badge tone="success">{CASE_STATUS_LABEL[status]}</Badge>
              ) : (
                <StatusBadge status={status} label={CASE_STATUS_LABEL[status]} />
              )}
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
