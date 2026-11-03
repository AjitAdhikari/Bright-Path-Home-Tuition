"use server";

import { createAdminClient } from "@/lib/supabase/server";
import {
  APPLICATION_STATUS_LABEL,
  type ApplicationStatus,
} from "@/lib/constants";

export type LookupState = {
  ok: boolean;
  error?: string;
  result?: {
    applicationNumber: string;
    statusLabel: string;
    status: ApplicationStatus;
    submittedAt: string | null;
    feedback: string | null;
    rejectionReason: string | null;
  };
};

/**
 * Public application-status lookup — no login. Requires BOTH the application
 * number and the email it was submitted with, so one value alone can't enumerate
 * applications. Runs with the service-role key (applicants are otherwise
 * admin-only under RLS).
 */
export async function lookupApplication(
  _prev: LookupState,
  formData: FormData
): Promise<LookupState> {
  const number = String(formData.get("application_number") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!number || !email) {
    return { ok: false, error: "Enter your application ID and email." };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("tutor_applicants")
    .select("application_number, status, submitted_at, admin_feedback, rejection_reason, email")
    .eq("application_number", number)
    .maybeSingle();

  const row = data as
    | {
        application_number: string;
        status: ApplicationStatus;
        submitted_at: string | null;
        admin_feedback: string | null;
        rejection_reason: string | null;
        email: string;
      }
    | null;

  if (!row || row.email.toLowerCase() !== email) {
    return {
      ok: false,
      error: "No application matches that ID and email. Please check and try again.",
    };
  }

  return {
    ok: true,
    result: {
      applicationNumber: row.application_number,
      status: row.status,
      statusLabel: APPLICATION_STATUS_LABEL[row.status],
      submittedAt: row.submitted_at,
      feedback: row.admin_feedback,
      rejectionReason: row.rejection_reason,
    },
  };
}
