"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  full_name: z.string().min(2, "Please enter your full name"),
  phone: z.string().regex(/^9\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
  education: z.string().min(2, "Tell us your highest qualification"),
  experience_years: z.coerce.number().min(0).max(50),
  gender: z.enum(["Male", "Female", "Other"]),
  levels: z.array(z.string()).min(1, "Choose at least one level you teach"),
  areas: z.string().min(2, "Where can you travel?"),
  bio: z.string().min(20, "A few sentences helps parents trust you"),
});

export type TutorState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function registerTutor(
  _prev: TutorState,
  formData: FormData
): Promise<TutorState> {
  const parsed = schema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    education: formData.get("education"),
    experience_years: formData.get("experience_years"),
    gender: formData.get("gender"),
    levels: formData.getAll("levels"),
    areas: formData.get("areas"),
    bio: formData.get("bio"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const d = parsed.data;

  try {
    const supabase = await createClient();
    const { data: signUp, error: authErr } = await supabase.auth.signUp({
      email: d.email,
      password: d.password,
      options: {
        data: { role: "tutor", full_name: d.full_name, phone: d.phone },
      },
    });
    if (authErr) throw authErr;

    const uid = signUp.user?.id;
    if (uid) {
      // profiles + tutor_profiles rows; verification_status starts "pending".
      await supabase.from("profiles").upsert({
        id: uid,
        role: "tutor",
        full_name: d.full_name,
        phone: d.phone,
        email: d.email,
      });
      await supabase.from("tutor_profiles").upsert({
        user_id: uid,
        bio: d.bio,
        education: d.education,
        experience_years: d.experience_years,
        gender: d.gender.toLowerCase(),
        verification_status: "pending",
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong.";
    return { ok: false, error: msg };
  }

  return { ok: true };
}
