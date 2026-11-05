"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail, applicationReceivedEmail } from "@/lib/email";
import { DOC_TYPE_MAP, DOC_TYPES, MAX_DOC_BYTES } from "@/lib/constants";

// Trim every string the same way the client does before validating, so a form
// the client accepted is never rejected by the server over stray whitespace
// (which would otherwise bounce the user back a step).
const trimmed = (msg: string, min = 1) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(min, msg)
  );

const schema = z.object({
  full_name: trimmed("Please enter your full name", 2),
  phone: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().regex(/^9\d{9}$/, "Enter a valid 10-digit mobile number")
  ),
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().email("Enter a valid email")
  ),
  education: trimmed("Tell us your highest qualification", 2),
  // Empty experience is allowed (treated as 0), matching the client.
  experience_years: z.preprocess(
    (v) => (v === "" || v == null ? 0 : v),
    z.coerce.number().min(0).max(50)
  ),
  gender: z.enum(["Male", "Female", "Other"]),
  levels: z.array(z.string()).min(1, "Choose at least one level you teach"),
  areas: trimmed("Where can you travel?", 2),
  bio: trimmed("A few sentences helps parents trust you", 20),
});

export type TutorState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  applicationNumber?: string;
};

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** Server-side file validation mirroring the client checks. */
function fileError(docType: string, file: File): string | null {
  const spec = DOC_TYPE_MAP[docType];
  if (!spec) return "Unknown document type.";
  if (file.size === 0) return null; // treated as "not provided"
  if (file.size > MAX_DOC_BYTES) return `${spec.label} must be under 5 MB.`;
  const ext = extOf(file.name);
  const ok = spec.exts.includes(ext) && (spec.mimes.includes(file.type) || !file.type);
  if (!ok) return `${spec.label} must be a ${spec.exts.join(", ").toUpperCase()} file.`;
  return null;
}

/**
 * Public tutor application — NO login required and NO auth account created.
 * Writes a `tutor_applicants` row and uploads the documents to the private
 * bucket under applicants/<id>/… using the service-role key. The Supabase auth
 * user is provisioned only when an admin approves (see app/admin/applicants).
 */
export async function submitApplication(
  _prev: TutorState,
  formData: FormData
): Promise<TutorState> {
  const parsed = schema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
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

  // Collect + validate files per doc type (CV is required).
  const collected: { docType: string; file: File }[] = [];
  for (const spec of DOC_TYPES) {
    const files = formData.getAll(spec.type).filter((f): f is File => f instanceof File && f.size > 0);
    if (spec.requirement === "required" && files.length === 0) {
      return {
        ok: false,
        error:
          spec.type === "cv"
            ? "Please upload your CV/Resume before submitting your application."
            : `Please upload your ${spec.label} before submitting your application.`,
      };
    }
    for (const file of files) {
      const err = fileError(spec.type, file);
      if (err) return { ok: false, error: err };
      if (!spec.multiple && collected.some((c) => c.docType === spec.type)) continue;
      collected.push({ docType: spec.type, file });
    }
  }

  console.log("[apply] start", { email: d.email, docs: collected.length });
  const admin = createAdminClient();

  // Shared applicant fields for both first-time and resubmission paths.
  const fields = {
    full_name: d.full_name,
    phone: d.phone,
    education: d.education,
    experience_years: d.experience_years,
    gender: d.gender.toLowerCase(),
    bio: d.bio,
    areas: d.areas,
    levels: d.levels.join(", "),
  };

  // Look for an existing OPEN application for this email. A review already in
  // progress can't be resubmitted over, but one the admin sent back
  // ("changes_requested") can — we update it in place and reset it to pending.
  const { data: existing } = await admin
    .from("tutor_applicants")
    .select("id, status, application_number")
    .eq("email", d.email)
    .in("status", ["pending_review", "under_review", "changes_requested"])
    .maybeSingle();
  console.log("[apply] existing lookup done", { found: !!existing });

  if (existing && (existing.status as string) !== "changes_requested") {
    return {
      ok: false,
      error:
        "An application with this email is already under review. Please check your email for updates.",
    };
  }

  let applicantId: string;
  let applicationNumber: string;

  if (existing) {
    // Resubmission after changes were requested: update the row, clear the
    // admin feedback, and move it back into the review queue.
    applicantId = existing.id as string;
    applicationNumber = existing.application_number as string;

    const { error: updErr } = await admin
      .from("tutor_applicants")
      .update({
        ...fields,
        status: "pending_review",
        admin_feedback: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicantId);
    if (updErr) {
      return { ok: false, error: "Something went wrong saving your application. Please try again." };
    }

    // Replace the previous documents: delete old storage objects + rows so the
    // freshly uploaded files below are the only ones the admin reviews.
    const { data: oldDocs } = await admin
      .from("applicant_documents")
      .select("storage_path")
      .eq("applicant_id", applicantId);
    const oldPaths = ((oldDocs ?? []) as { storage_path: string }[])
      .map((o) => o.storage_path)
      .filter(Boolean);
    if (oldPaths.length) {
      await admin.storage.from("tutor-documents").remove(oldPaths);
      await admin.from("applicant_documents").delete().eq("applicant_id", applicantId);
    }
  } else {
    // 1. First-time application: create the applicant.
    const { data: created, error: insErr } = await admin
      .from("tutor_applicants")
      .insert({ ...fields, email: d.email })
      .select("id, application_number")
      .single();

    if (insErr || !created) {
      return { ok: false, error: "Something went wrong saving your application. Please try again." };
    }
    applicantId = created.id as string;
    applicationNumber = created.application_number as string;
  }
  console.log("[apply] row saved", { applicantId, applicationNumber });

  // 2. Upload each document and record it.
  for (const { docType, file } of collected) {
    console.log("[apply] uploading", docType, file.name);
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `applicants/${applicantId}/${docType}-${Date.now()}-${safeName}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from("tutor-documents")
      .upload(path, bytes, { contentType: file.type || undefined, upsert: false });
    if (upErr) continue; // skip a failed file rather than losing the whole application
    await admin.from("applicant_documents").insert({
      applicant_id: applicantId,
      doc_type: docType,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
    });
  }

  console.log("[apply] uploads done, sending ack email");

  // 3. Acknowledge by email — strictly best-effort. The application is already
  //    saved; never let a slow/unreachable mail server hold up the response (it
  //    would freeze the submit button on "Submitting…"). Cap the wait, and if it
  //    overruns let the send finish in the background. Delivery is still audited
  //    in email_notifications, so a miss here is visible to admins.
  try {
    const mail = applicationReceivedEmail(d.full_name);
    const send = sendEmail({
      to: d.email,
      subject: mail.subject,
      html: mail.html,
      template: "application_received",
    });
    send.catch(() => {}); // swallow late rejection if the race below wins
    await Promise.race([
      send,
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ]);
  } catch {
    /* best-effort */
  }

  console.log("[apply] done, returning success");
  return { ok: true, applicationNumber };
}
