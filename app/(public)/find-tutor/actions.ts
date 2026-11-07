"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { BOARDS, MODES, GENDER_PREF } from "@/lib/constants";
import { limitByIp } from "@/lib/rate-limit";

const schema = z.object({
  contact_name: z.string().min(2, "Please enter your name"),
  phone: z
    .string()
    .regex(/^9\d{9}$/, "Enter a valid 10-digit Nepali mobile number"),
  child_grade: z.string().min(1, "Please select a class"),
  board: z.enum(BOARDS),
  subjects: z.array(z.string()).min(1, "Pick at least one subject"),
  area: z.string().min(2, "Where should the tutor come?"),
  full_address: z.string().optional().default(""),
  mode: z.enum(MODES),
  budget: z.coerce.number().min(1000, "Budget looks too low"),
  gender_pref: z.enum(GENDER_PREF),
  notes: z.string().optional().default(""),
});

export type MatchedTutor = {
  user_id: string;
  full_name: string;
  bio: string | null;
  education: string | null;
  experience_years: number;
  gender: string | null;
  photo_path: string | null;
  teaches_online: boolean;
  rating_avg: number;
  matched_subjects: number;
  from_fee: number;
  subjects: string[];
};

export type RequestState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
  matches?: MatchedTutor[];
};

export async function submitRequest(
  _prev: RequestState,
  formData: FormData
): Promise<RequestState> {
  const rl = await limitByIp("find-tutor", 10, 10 * 60_000);
  if (!rl.ok) {
    return {
      ok: false,
      error: `Too many requests. Please wait ${rl.retryAfterSec}s and try again.`,
    };
  }

  const parsed = schema.safeParse({
    contact_name: formData.get("contact_name"),
    phone: formData.get("phone"),
    child_grade: formData.get("child_grade"),
    board: formData.get("board"),
    subjects: formData.getAll("subjects"),
    area: formData.get("area"),
    full_address: formData.get("full_address"),
    mode: formData.get("mode"),
    budget: formData.get("budget"),
    gender_pref: formData.get("gender_pref"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  try {
    const supabase = await createClient();
    // One SECURITY DEFINER call saves the request (+ subjects, note, area)
    // and returns the matching verified tutors — so even a guest gets a
    // ranked list back without being able to read the raw tables.
    // Args/return are typed loosely until `npm run db:types` regenerates
    // lib/database.types.ts from the live schema (incl. this RPC).
    const { data: result, error } = await supabase.rpc(
      "submit_tuition_request" as never,
      {
        p_contact_name: data.contact_name,
        p_phone: data.phone,
        p_child_grade: data.child_grade,
        p_board: data.board,
        p_subjects: data.subjects,
        p_area: data.area,
        p_full_address: data.full_address,
        p_mode: data.mode,
        p_budget: data.budget,
        p_gender_pref: data.gender_pref,
        p_notes: data.notes,
      } as never
    );
    if (error) throw error;

    const payload = (result ?? {}) as {
      request_id?: string;
      matches?: MatchedTutor[];
    };
    return {
      ok: true,
      requestId: payload.request_id,
      matches: payload.matches ?? [],
    };
  } catch {
    // Never block the parent on a DB hiccup — the WhatsApp fallback still works.
    return {
      ok: false,
      error:
        "We couldn't save that automatically. Please message us on WhatsApp and we'll take it from there.",
    };
  }
}
