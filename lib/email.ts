import "server-only";
import { SITE } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Transactional email via Resend's REST API (no SDK dependency — a plain
 * `fetch`). Every send is logged to `email_notifications` for admin audit.
 *
 * Email is OPTIONAL infrastructure: if RESEND_API_KEY is absent the call is a
 * graceful no-op (status "skipped"), so the application workflow never blocks
 * on mail delivery. Set RESEND_API_KEY + EMAIL_FROM in the environment and a
 * verified sender/domain in Resend to make delivery live.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type EmailTemplate =
  | "application_received"
  | "application_approved"
  | "application_changes_requested"
  | "application_rejected";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  template: EmailTemplate;
  /** Links the audit record to a tutor application when known. */
  applicationId?: string | null;
};

type SendResult = {
  status: "sent" | "failed" | "skipped";
  providerId?: string;
  error?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  template,
  applicationId = null,
}: SendArgs): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? `${SITE.name} <onboarding@resend.dev>`;

  let result: SendResult;

  if (!apiKey) {
    result = { status: "skipped", error: "RESEND_API_KEY not configured" };
  } else {
    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        result = { status: "failed", error: `Resend ${res.status}: ${body}`.slice(0, 500) };
      } else {
        const data = (await res.json().catch(() => ({}))) as { id?: string };
        result = { status: "sent", providerId: data.id };
      }
    } catch (e) {
      result = {
        status: "failed",
        error: e instanceof Error ? e.message.slice(0, 500) : "send failed",
      };
    }
  }

  // Best-effort audit log — never let logging failure surface to the caller.
  try {
    const admin = createAdminClient();
    await admin.from("email_notifications").insert({
      application_id: applicationId,
      to_email: to,
      template,
      subject,
      status: result.status,
      provider_id: result.providerId ?? null,
      error: result.error ?? null,
      sent_at: result.status === "sent" ? new Date().toISOString() : null,
    });
  } catch {
    // swallow — the email outcome is what matters to the workflow
  }

  return result;
}

/* ── Templates ─────────────────────────────────────────────────────────── */

const SIG = `<p style="margin:24px 0 0;color:#5a6676">Best regards,<br/><strong>${SITE.name} Team</strong></p>`;

function shell(body: string) {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#19222f;line-height:1.6">
    <h2 style="color:#17284d;margin:0 0 16px">${SITE.name}</h2>
    ${body}
    ${SIG}
  </div>`;
}

export function applicationReceivedEmail(name: string) {
  return {
    subject: "Your Tutor Application Has Been Received",
    html: shell(`
      <p>Dear ${escapeHtml(name)},</p>
      <p>Thank you for applying to become a tutor at ${SITE.fullName}.</p>
      <p>We have successfully received your application and documents. Your
      application is currently <strong>pending review</strong> by our admin team.</p>
      <p>Once your application is approved, you will receive another email with
      instructions on how to access your Teacher Dashboard.</p>
      <p>Thank you for your interest in joining ${SITE.name}.</p>
    `),
  };
}

export function applicationApprovedEmail(name: string, setPasswordUrl: string) {
  return {
    subject: "Congratulations! Your Tutor Application Has Been Approved",
    html: shell(`
      <p>Dear ${escapeHtml(name)},</p>
      <p><strong>Congratulations!</strong></p>
      <p>We are pleased to inform you that your application to become a tutor at
      ${SITE.fullName} has been reviewed and <strong>approved</strong> by our admin team.</p>
      <p>Your Teacher account is now ready. Set your password using the secure
      link below, then sign in to access your Teacher Dashboard:</p>
      <p><a href="${setPasswordUrl}" style="display:inline-block;background:#17284d;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Set your password &amp; sign in</a></p>
      <p style="color:#5a6676;font-size:13px">This link expires for your security. If it has expired, use “Forgot password” on the login page with this email.</p>
      <p>We look forward to working with you!</p>
    `),
  };
}

export function applicationChangesRequestedEmail(
  name: string,
  feedback: string,
  statusUrl: string
) {
  return {
    subject: "Action Needed on Your Tutor Application",
    html: shell(`
      <p>Dear ${escapeHtml(name)},</p>
      <p>Our admin team has reviewed your application and needs a few changes
      before it can be approved:</p>
      <blockquote style="border-left:3px solid #e0a23b;margin:16px 0;padding:8px 16px;color:#45505f;background:#fdf6e8">${escapeHtml(feedback)}</blockquote>
      <p>Please update the requested information and resubmit your application:</p>
      <p><a href="${statusUrl}" style="display:inline-block;background:#17284d;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Update My Application</a></p>
    `),
  };
}

export function applicationRejectedEmail(name: string, reason?: string) {
  return {
    subject: "Update on Your Tutor Application",
    html: shell(`
      <p>Dear ${escapeHtml(name)},</p>
      <p>Thank you for your interest in joining ${SITE.fullName}. After careful
      review, we are unable to approve your application at this time.</p>
      ${reason ? `<blockquote style="border-left:3px solid #b4322b;margin:16px 0;padding:8px 16px;color:#45505f;background:#fbf3f2">${escapeHtml(reason)}</blockquote>` : ""}
      <p>You are welcome to apply again in the future.</p>
    `),
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
