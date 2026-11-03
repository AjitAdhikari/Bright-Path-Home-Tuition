"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { VerificationStatus } from "@/lib/constants";

/**
 * Set a tutor's verification status. RLS only lets an admin through, and the
 * `guard_verification` trigger blocks anyone else from touching these columns.
 */
export async function setTutorStatus(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "");
  const status = String(formData.get("status") ?? "") as VerificationStatus;
  if (!userId || !status) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("tutor_profiles")
    .update({
      verification_status: status,
      verified_by: status === "approved" ? user?.id ?? null : null,
      verified_at: status === "approved" ? new Date().toISOString() : null,
    } as never)
    .eq("user_id", userId);

  revalidatePath("/admin/tutors");
  revalidatePath("/admin");
}
