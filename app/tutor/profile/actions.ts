"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Save the tutor's own public profile. RLS restricts this to the owner, and
 *  the verification columns are protected by the guard_verification trigger. */
export async function updateTutorProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const experience = Number(formData.get("experience_years") ?? 0);

  await supabase
    .from("tutor_profiles")
    .update({
      bio: String(formData.get("bio") ?? ""),
      education: String(formData.get("education") ?? ""),
      experience_years: Number.isFinite(experience) ? experience : 0,
      teaches_online: formData.get("teaches_online") === "on",
    } as never)
    .eq("user_id", user.id);

  revalidatePath("/tutor/profile");
  revalidatePath("/tutor");
}
