"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Move a case to a new status. Admin-only via RLS. */
export async function updateCaseStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;

  const supabase = await createClient();
  await supabase.from("requests").update({ status } as never).eq("id", id);
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath("/admin/requests");
}

/** Add a call/case note. */
export async function addCaseNote(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!requestId || !note) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase
    .from("case_notes")
    .insert({ request_id: requestId, admin_id: user?.id ?? null, note } as never);
  revalidatePath(`/admin/requests/${requestId}`);
}

/** Share the selected tutors with the parent and advance the case. */
export async function shareTutors(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "");
  const tutorIds = formData.getAll("tutor_ids").map(String).filter(Boolean);
  if (!requestId || tutorIds.length === 0) return;

  const supabase = await createClient();
  await supabase
    .from("matches")
    .insert(
      tutorIds.map((tutor_id) => ({
        request_id: requestId,
        tutor_id,
        status: "shared",
      })) as never
    );
  await supabase
    .from("requests")
    .update({ status: "tutors_shared" } as never)
    .eq("id", requestId);

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
}
