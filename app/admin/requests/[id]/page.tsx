import { notFound } from "next/navigation";
import { Card, StatusBadge, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import {
  CASE_STATUS,
  CASE_STATUS_LABEL,
  type CaseStatus,
} from "@/lib/constants";
import { npr, prettyDate } from "@/lib/utils";
import type { MatchedTutor } from "@/app/(public)/find-tutor/actions";
import { updateCaseStatus, addCaseNote, shareTutors } from "./actions";

type RequestRow = {
  id: string;
  contact_name: string;
  phone: string;
  child_grade: string;
  board: string | null;
  mode: string;
  budget: number | null;
  gender_pref: string;
  full_address: string | null;
  status: CaseStatus;
  created_at: string;
  area: { name: string } | null;
  request_subjects: Array<{ subjects: { name: string } | null }> | null;
};

type NoteRow = { id: string; note: string; created_at: string };

export default async function CaseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("requests")
    .select(
      "id, contact_name, phone, child_grade, board, mode, budget, gender_pref, full_address, status, created_at, area:areas(name), request_subjects(subjects(name))"
    )
    .eq("id", id)
    .maybeSingle();

  const request = data as RequestRow | null;
  if (!request) notFound();

  const [{ data: matchData }, { data: noteData }] = await Promise.all([
    supabase.rpc("match_tutors" as never, { p_request: id } as never),
    supabase
      .from("case_notes")
      .select("id, note, created_at")
      .eq("request_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const matches = (matchData ?? []) as MatchedTutor[];
  const notes = (noteData ?? []) as NoteRow[];
  const subjects = (request.request_subjects ?? [])
    .map((r) => r.subjects?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Case #{id.slice(0, 8)} · {prettyDate(request.created_at)}
              </p>
              <h2 className="text-xl font-bold text-foreground">
                {request.contact_name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {request.child_grade}
                {subjects && ` · ${subjects}`} ·{" "}
                <span className="capitalize">{request.mode}</span> tuition
              </p>
            </div>
            <StatusBadge
              status={request.status}
              label={CASE_STATUS_LABEL[request.status]}
            />
          </div>
          <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <Detail k="Phone" v={request.phone} />
            <Detail k="Area" v={request.area?.name ?? "—"} />
            <Detail k="Budget" v={request.budget ? npr(request.budget) : "—"} />
            <Detail
              k="Preferred"
              v={`${
                request.gender_pref === "any"
                  ? "Any gender"
                  : request.gender_pref
              }`}
            />
            {request.full_address && (
              <Detail k="Address" v={request.full_address} />
            )}
          </dl>
        </Card>

        {/* Shortlist tutors */}
        <Card>
          <h3 className="font-bold text-foreground">Shortlist tutors</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tick the tutors that fit, then share them with the parent.
          </p>
          {matches.length === 0 ? (
            <p className="mt-4 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              No verified tutors match this requirement yet. Add tutors or widen
              the criteria.
            </p>
          ) : (
            <form action={shareTutors} className="mt-4">
              <input type="hidden" name="request_id" value={id} />
              <ul className="space-y-3">
                {matches.map((t) => (
                  <li
                    key={t.user_id}
                    className="flex items-center justify-between rounded-xl border border-border p-3"
                  >
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name="tutor_ids"
                        value={t.user_id}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      <span>
                        <span className="font-semibold text-foreground">
                          {t.full_name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {t.subjects.join(", ")} · {t.experience_years} yrs ·{" "}
                          {t.rating_avg > 0 ? `${t.rating_avg}★ · ` : ""}
                          from {npr(t.from_fee)}
                        </span>
                      </span>
                    </label>
                    <Badge tone="success">Verified</Badge>
                  </li>
                ))}
              </ul>
              <Button type="submit" className="mt-4">
                Share selected with parent
              </Button>
            </form>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        {/* Move status */}
        <Card>
          <h3 className="font-bold text-foreground">Move status</h3>
          <form action={updateCaseStatus} className="mt-3 space-y-3">
            <input type="hidden" name="id" value={id} />
            <select
              name="status"
              defaultValue={request.status}
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground"
            >
              {CASE_STATUS.map((s) => (
                <option key={s} value={s}>
                  {CASE_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" className="w-full">
              Update status
            </Button>
          </form>
        </Card>

        {/* Call notes */}
        <Card>
          <h3 className="font-bold text-foreground">Call notes</h3>
          <form action={addCaseNote} className="mt-3 space-y-3">
            <input type="hidden" name="request_id" value={id} />
            <textarea
              name="note"
              required
              className="min-h-24 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="What did the parent say?"
            />
            <Button type="submit" variant="outline" className="w-full">
              Add note
            </Button>
          </form>

          {notes.length > 0 && (
            <ul className="mt-4 space-y-3 text-sm">
              {notes.map((n) => (
                <li key={n.id} className="rounded-xl bg-muted p-3">
                  <p className="text-foreground">{n.note}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {prettyDate(n.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium text-foreground">{v}</dd>
    </div>
  );
}
