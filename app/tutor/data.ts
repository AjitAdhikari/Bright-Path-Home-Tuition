import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const TZ = "Asia/Kathmandu";

/** "YYYY-MM-DD" for a date in Nepal time. */
export function ktmDay(d: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

export type MatchStatus =
  | "shared"
  | "accepted"
  | "declined"
  | "demo_scheduled"
  | "demo_done"
  | "chosen"
  | "not_chosen";

/** The safe part of a parent's request. Phone and address are never exposed. */
export type RequestInfo = {
  grade: string;
  board: string | null;
  area: string | null;
  mode: "home" | "online";
  budget: number | null;
};

export type Lead = {
  id: string;
  status: MatchStatus;
  demoDate: string | null;
  proposedFee: number | null;
  sharedAt: string;
  request: RequestInfo | null;
};

export type Tuition = {
  id: string;
  status: "active" | "ended";
  monthlyFee: number;
  startDate: string | null;
  request: RequestInfo | null;
};

/**
 * Everything the tutor's matches and tuitions need, joined in JS.
 *
 * Tutors can't read `requests` directly (RLS: parents + admins only), so the
 * request details come from `tutor_lead_view`, which exposes only grade,
 * board, area, mode and budget.
 */
export async function loadTutorWork(supabase: Supabase, uid: string) {
  const [{ data: matchRows }, { data: tuitionRows }, { data: areaRows }] = await Promise.all([
    supabase
      .from("matches")
      .select("id, request_id, status, demo_date, proposed_fee, created_at")
      .eq("tutor_id", uid)
      .order("created_at", { ascending: false }),
    supabase
      .from("tuitions")
      .select("id, match_id, status, monthly_fee, start_date, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("areas").select("id, name"),
  ]);

  const matches = (matchRows ?? []) as {
    id: string;
    request_id: string;
    status: MatchStatus;
    demo_date: string | null;
    proposed_fee: number | null;
    created_at: string;
  }[];

  const requestIds = [...new Set(matches.map((m) => m.request_id))];
  const { data: viewRows } = requestIds.length
    ? await supabase
        .from("tutor_lead_view")
        .select("id, child_grade, board, area_id, mode, budget")
        .in("id", requestIds)
    : { data: [] };

  const areaName = new Map(
    ((areaRows ?? []) as { id: number; name: string }[]).map((a) => [a.id, a.name])
  );
  const requests = new Map<string, RequestInfo>();
  for (const r of (viewRows ?? []) as {
    id: string;
    child_grade: string;
    board: string | null;
    area_id: number | null;
    mode: "home" | "online";
    budget: number | null;
  }[]) {
    requests.set(r.id, {
      grade: r.child_grade,
      board: r.board,
      area: r.area_id != null ? areaName.get(r.area_id) ?? null : null,
      mode: r.mode,
      budget: r.budget != null ? Number(r.budget) : null,
    });
  }

  const matchById = new Map(matches.map((m) => [m.id, m]));

  const leads: Lead[] = matches.map((m) => ({
    id: m.id,
    status: m.status,
    demoDate: m.demo_date,
    proposedFee: m.proposed_fee != null ? Number(m.proposed_fee) : null,
    sharedAt: m.created_at,
    request: requests.get(m.request_id) ?? null,
  }));

  const tuitions: Tuition[] = (
    (tuitionRows ?? []) as {
      id: string;
      match_id: string;
      status: "active" | "ended";
      monthly_fee: number;
      start_date: string | null;
    }[]
  )
    .filter((t) => matchById.has(t.match_id))
    .map((t) => ({
      id: t.id,
      status: t.status,
      monthlyFee: Number(t.monthly_fee),
      startDate: t.start_date,
      request: requests.get(matchById.get(t.match_id)!.request_id) ?? null,
    }));

  return { leads, tuitions };
}

/** Short human line for a request, e.g. "Class 6–8 · NEB · Baneshwor". */
export function describeRequest(r: RequestInfo | null) {
  if (!r) return { title: "Tuition request", detail: "" };
  const where = r.mode === "online" ? "Online" : r.area ?? "Home tuition";
  return {
    title: r.board ? `${r.grade} · ${r.board}` : r.grade,
    detail: where,
  };
}
