import type { createClient } from "@/lib/supabase/server";
import type { CaseStatus } from "@/lib/constants";

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

export type ParentRequest = {
  id: string;
  grade: string;
  board: string | null;
  subjects: string[];
  area: string | null;
  mode: "home" | "online";
  budget: number | null;
  status: CaseStatus;
  createdAt: string;
};

export type SharedTutor = {
  matchId: string;
  requestId: string;
  tutorId: string;
  name: string;
  education: string | null;
  experienceYears: number;
  rating: number;
  status: MatchStatus;
  demoDate: string | null;
  proposedFee: number | null;
};

export type ParentTuition = {
  id: string;
  requestId: string;
  tutorName: string;
  status: "active" | "ended";
  monthlyFee: number;
  startDate: string | null;
};

export type ParentPayment = {
  id: string;
  tuitionId: string | null;
  amount: number;
  method: string;
  status: "pending" | "paid" | "failed" | "refunded";
  date: string;
};

/**
 * The parent's requests, the tutors shared with them, their tuitions and
 * payments — joined in JS. Everything is filtered to `parent_id = uid`, so an
 * admin previewing /parent sees only their own (not every family's) data.
 */
export async function loadParentWork(supabase: Supabase, uid: string) {
  const [{ data: reqRows }, { data: areaRows }] = await Promise.all([
    supabase
      .from("requests")
      .select("id, child_grade, board, area_id, mode, budget, status, created_at, request_subjects(subjects(name))")
      .eq("parent_id", uid)
      .order("created_at", { ascending: false }),
    supabase.from("areas").select("id, name"),
  ]);

  const areaName = new Map(((areaRows ?? []) as { id: number; name: string }[]).map((a) => [a.id, a.name]));

  const requests: ParentRequest[] = (
    (reqRows ?? []) as unknown as {
      id: string;
      child_grade: string;
      board: string | null;
      area_id: number | null;
      mode: "home" | "online";
      budget: number | null;
      status: CaseStatus;
      created_at: string;
      request_subjects: { subjects: { name: string } | null }[] | null;
    }[]
  ).map((r) => ({
    id: r.id,
    grade: r.child_grade,
    board: r.board,
    subjects: (r.request_subjects ?? []).map((s) => s.subjects?.name).filter((s): s is string => !!s),
    area: r.area_id != null ? areaName.get(r.area_id) ?? null : null,
    mode: r.mode,
    budget: r.budget != null ? Number(r.budget) : null,
    status: r.status,
    createdAt: r.created_at,
  }));

  const requestIds = requests.map((r) => r.id);
  if (requestIds.length === 0) {
    return { requests, tutors: [] as SharedTutor[], tuitions: [] as ParentTuition[], payments: [] as ParentPayment[] };
  }

  const { data: matchRows } = await supabase
    .from("matches")
    .select("id, request_id, tutor_id, status, demo_date, proposed_fee")
    .in("request_id", requestIds)
    .order("created_at", { ascending: true });
  const matches = (matchRows ?? []) as {
    id: string;
    request_id: string;
    tutor_id: string;
    status: MatchStatus;
    demo_date: string | null;
    proposed_fee: number | null;
  }[];

  const tutorIds = [...new Set(matches.map((m) => m.tutor_id))];
  const matchIds = matches.map((m) => m.id);

  // Tutor names come from the public (approved-only) view; parents can't read profiles.
  const [{ data: tutorRows }, { data: tuitionRows }] = await Promise.all([
    tutorIds.length
      ? supabase
          .from("public_tutors")
          .select("user_id, full_name, education, experience_years, rating_avg")
          .in("user_id", tutorIds)
      : Promise.resolve({ data: [] }),
    matchIds.length
      ? supabase
          .from("tuitions")
          .select("id, match_id, status, monthly_fee, start_date")
          .in("match_id", matchIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const tutorInfo = new Map(
    (
      (tutorRows ?? []) as {
        user_id: string;
        full_name: string;
        education: string | null;
        experience_years: number | null;
        rating_avg: number | null;
      }[]
    ).map((t) => [t.user_id, t])
  );
  const matchById = new Map(matches.map((m) => [m.id, m]));

  const tutors: SharedTutor[] = matches.map((m) => {
    const t = tutorInfo.get(m.tutor_id);
    return {
      matchId: m.id,
      requestId: m.request_id,
      tutorId: m.tutor_id,
      name: t?.full_name ?? "Bright Path tutor",
      education: t?.education ?? null,
      experienceYears: Number(t?.experience_years ?? 0),
      rating: Number(t?.rating_avg ?? 0),
      status: m.status,
      demoDate: m.demo_date,
      proposedFee: m.proposed_fee != null ? Number(m.proposed_fee) : null,
    };
  });

  const tuitions: ParentTuition[] = (
    (tuitionRows ?? []) as {
      id: string;
      match_id: string;
      status: "active" | "ended";
      monthly_fee: number;
      start_date: string | null;
    }[]
  ).map((t) => {
    const m = matchById.get(t.match_id)!;
    return {
      id: t.id,
      requestId: m.request_id,
      tutorName: tutorInfo.get(m.tutor_id)?.full_name ?? "Your tutor",
      status: t.status,
      monthlyFee: Number(t.monthly_fee),
      startDate: t.start_date,
    };
  });

  const tuitionIds = tuitions.map((t) => t.id);
  const { data: payRows } = tuitionIds.length
    ? await supabase
        .from("payments")
        .select("id, tuition_id, amount, method, status, paid_at, created_at")
        .eq("direction", "in")
        .in("tuition_id", tuitionIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const payments: ParentPayment[] = (
    (payRows ?? []) as {
      id: string;
      tuition_id: string | null;
      amount: number;
      method: string;
      status: ParentPayment["status"];
      paid_at: string | null;
      created_at: string;
    }[]
  ).map((p) => ({
    id: p.id,
    tuitionId: p.tuition_id,
    amount: Number(p.amount),
    method: p.method,
    status: p.status,
    date: p.paid_at ?? p.created_at,
  }));

  return { requests, tutors, tuitions, payments };
}

/* ------------------------------------------------------------------ */
/* How a request moves along, in a parent's words.                      */
/* ------------------------------------------------------------------ */

export const STEPS = ["Request received", "Checked by us", "Tutors shared", "Demo class", "Classes started"];

/** Index of the step a status sits on (0-based). */
export function stepOf(status: CaseStatus) {
  switch (status) {
    case "new":
      return 0;
    case "verified":
      return 1;
    case "tutors_shared":
    case "replacement":
      return 2;
    case "demo_scheduled":
    case "demo_done":
      return 3;
    default:
      return 4; // confirmed, active, closed
  }
}

export const NEXT_STEP: Record<CaseStatus, string> = {
  new: "We've got your request and will call you soon to confirm the details.",
  verified: "We've confirmed the details and are picking verified tutors for you.",
  tutors_shared: "We've shared tutors with you. Choose one for a free demo class.",
  demo_scheduled: "Your free demo class is booked.",
  demo_done: "How was the demo? Let us know if you'd like to continue with this tutor.",
  confirmed: "Confirmed. Pay the first month to start regular classes.",
  active: "Classes are running.",
  replacement: "We're finding a replacement tutor for you.",
  closed: "This request is closed.",
};

export function requestTitle(r: Pick<ParentRequest, "grade" | "board">) {
  return r.board ? `${r.grade} · ${r.board}` : r.grade;
}

export function requestDetail(r: ParentRequest) {
  return [
    r.subjects.length ? r.subjects.join(", ") : null,
    r.mode === "online" ? "Online" : r.area ?? "Home tuition",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function shortDate(d: string) {
  return new Date(d.length === 10 ? d + "T00:00:00" : d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: d.length === 10 ? undefined : TZ,
  });
}

export function waLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
