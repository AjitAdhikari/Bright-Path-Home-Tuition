"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  sendEmail,
  applicationApprovedEmail,
  applicationChangesRequestedEmail,
  applicationRejectedEmail,
} from "@/lib/email";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if ((data as { role?: string } | null)?.role !== "admin") {
    throw new Error("Not authorised");
  }
  return user.id;
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

type Applicant = {
  id: string;
  application_number: string;
  full_name: string;
  email: string;
  phone: string | null;
  education: string | null;
  experience_years: number | null;
  gender: string | null;
  bio: string | null;
  submitted_at: string | null;
};

/**
 * Approve an applicant: provision the Supabase auth user (first time the tutor
 * gets a login), copy their documents into their own folder, mark everything
 * approved, and email a set-password link. Runs with the service-role key.
 */
export async function approveApplicant(formData: FormData): Promise<void> {
  const adminId = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createAdminClient();

  const { data: appData } = await admin
    .from("tutor_applicants")
    .select(
      "id, application_number, full_name, email, phone, education, experience_years, gender, bio, submitted_at"
    )
    .eq("id", id)
    .single();
  const a = appData as Applicant | null;
  if (!a || !a.email) return;

  // 1. Create the auth user (or reuse one that already exists for this email).
  let uid: string | undefined;
  const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
    email: a.email,
    email_confirm: true,
    user_metadata: { role: "tutor", full_name: a.full_name, phone: a.phone },
  });
  if (createErr) {
    // Email already registered — find the existing user instead.
    const { data: list } = await admin.auth.admin.listUsers();
    uid = (list?.users as { id: string; email?: string | null }[] | undefined)?.find(
      (u) => u.email?.toLowerCase() === a.email.toLowerCase()
    )?.id;
  } else {
    uid = createdUser?.user?.id;
  }
  if (!uid) return;

  // 2. Ensure profile + approved tutor_profile exist (handle_new_user already
  //    inserted the profile row via trigger).
  await admin.from("profiles").upsert({
    id: uid,
    role: "tutor",
    full_name: a.full_name,
    phone: a.phone,
    email: a.email,
  });
  await admin.from("tutor_profiles").upsert({
    user_id: uid,
    bio: a.bio,
    education: a.education,
    experience_years: a.experience_years ?? 0,
    gender: a.gender,
    verification_status: "approved",
    verified_by: adminId,
    verified_at: new Date().toISOString(),
  });

  // 3. Move documents applicants/<id>/… -> <uid>/… and record tutor_documents.
  const { data: docData } = await admin
    .from("applicant_documents")
    .select("doc_type, storage_path, file_name, mime_type, size_bytes")
    .eq("applicant_id", id);
  const docs = (docData ?? []) as {
    doc_type: string;
    storage_path: string;
    file_name: string | null;
    mime_type: string | null;
    size_bytes: number | null;
  }[];
  for (const d of docs) {
    const base = d.storage_path.split("/").pop() ?? `${d.doc_type}-${Date.now()}`;
    const dest = `${uid}/${base}`;
    const { error: moveErr } = await admin.storage
      .from("tutor-documents")
      .move(d.storage_path, dest);
    const finalPath = moveErr ? d.storage_path : dest;
    await admin.from("tutor_documents").insert({
      tutor_id: uid,
      doc_type: d.doc_type,
      storage_path: finalPath,
      file_name: d.file_name,
      mime_type: d.mime_type,
      size_bytes: d.size_bytes,
    });
  }

  // 4. Replace the trigger-created application with an approved one, keeping the
  //    original application number for continuity.
  await admin.from("tutor_applications").delete().eq("tutor_id", uid);
  await admin.from("tutor_applications").insert({
    tutor_id: uid,
    application_number: a.application_number,
    status: "approved",
    submitted_at: a.submitted_at ?? new Date().toISOString(),
    reviewed_by: adminId,
    reviewed_at: new Date().toISOString(),
  });

  // 5. Mark the applicant approved + linked.
  await admin
    .from("tutor_applicants")
    .update({
      status: "approved",
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      provisioned_user_id: uid,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // 6. Email a set-password link.
  let link = `${siteUrl()}/login`;
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: a.email,
    options: { redirectTo: `${siteUrl()}/reset-password` },
  });
  if (linkData?.properties?.action_link) link = linkData.properties.action_link;

  const mail = applicationApprovedEmail(a.full_name, link);
  const sent = await sendEmail({
    to: a.email,
    subject: mail.subject,
    html: mail.html,
    template: "application_approved",
  });
  if (sent.status !== "sent") {
    console.warn(
      `[email] approval mail ${sent.status} for ${a.email}: ${sent.error ?? ""}`
    );
  }

  revalidatePath("/admin/applicants");
  revalidatePath(`/admin/applicants/${id}`);
}

export async function rejectApplicant(formData: FormData): Promise<void> {
  const adminId = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!id) return;

  const admin = createAdminClient();
  const { data } = await admin
    .from("tutor_applicants")
    .select("full_name, email")
    .eq("id", id)
    .single();
  const a = data as { full_name: string; email: string } | null;

  await admin
    .from("tutor_applicants")
    .update({
      status: "rejected",
      rejection_reason: reason,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (a?.email) {
    const mail = applicationRejectedEmail(a.full_name, reason ?? undefined);
    const sent = await sendEmail({
      to: a.email,
      subject: mail.subject,
      html: mail.html,
      template: "application_rejected",
    });
    if (sent.status !== "sent") {
      console.warn(
        `[email] rejection mail ${sent.status} for ${a.email}: ${sent.error ?? ""}`
      );
    }
  }

  revalidatePath("/admin/applicants");
  revalidatePath(`/admin/applicants/${id}`);
}

export async function requestChanges(formData: FormData): Promise<void> {
  const adminId = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();
  if (!id || !feedback) return;

  const admin = createAdminClient();
  const { data } = await admin
    .from("tutor_applicants")
    .select("full_name, email")
    .eq("id", id)
    .single();
  const a = data as { full_name: string; email: string } | null;

  await admin
    .from("tutor_applicants")
    .update({
      status: "changes_requested",
      admin_feedback: feedback,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (a?.email) {
    const mail = applicationChangesRequestedEmail(
      a.full_name,
      feedback,
      `${siteUrl()}/become-tutor`
    );
    const sent = await sendEmail({
      to: a.email,
      subject: mail.subject,
      html: mail.html,
      template: "application_changes_requested",
    });
    if (sent.status !== "sent") {
      console.warn(
        `[email] changes-requested mail ${sent.status} for ${a.email}: ${sent.error ?? ""}`
      );
    }
  }

  revalidatePath("/admin/applicants");
  revalidatePath(`/admin/applicants/${id}`);
}
