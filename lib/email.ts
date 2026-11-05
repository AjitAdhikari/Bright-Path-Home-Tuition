import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { SITE } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Transactional email over SMTP (via nodemailer). Every send is logged to
 * `email_notifications` for admin audit.
 *
 * Email is OPTIONAL infrastructure: if SMTP is not configured the call is a
 * graceful no-op (status "skipped"), so the application workflow never blocks
 * on mail delivery. Set these environment variables to make delivery live:
 *
 *   SMTP_HOST      e.g. smtp.gmail.com, smtp.zoho.com, mail.yourdomain.com
 *   SMTP_PORT      587 (STARTTLS, default) or 465 (implicit TLS)
 *   SMTP_SECURE    "true" for port 465, otherwise leave unset/"false"
 *   SMTP_USER      the SMTP login (usually the full email address)
 *   SMTP_PASS      the SMTP password / app password
 *   EMAIL_FROM     the From header, e.g. Bright Path <noreply@yourdomain.com>
 *
 * The transporter is created once per server process and reused.
 */

let cachedTransporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // All three are required for a usable connection; otherwise email is disabled.
  if (!host || !user || !pass) {
    cachedTransporter = null;
    return null;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  // Port 465 uses implicit TLS; 587/25 use STARTTLS (secure:false + upgrade).
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : port === 465;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return cachedTransporter;
}

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
  const from =
    process.env.EMAIL_FROM ??
    process.env.SMTP_USER ??
    `${SITE.name} <no-reply@localhost>`;
  const transporter = getTransporter();

  let result: SendResult;

  if (!transporter) {
    result = { status: "skipped", error: "SMTP not configured" };
  } else {
    try {
      const info = await transporter.sendMail({ from, to, subject, html });
      // SMTP accepted the message for at least one recipient.
      const accepted = (info.accepted ?? []) as Array<string | { address: string }>;
      if (accepted.length === 0) {
        result = {
          status: "failed",
          error: `No recipient accepted: ${info.response ?? ""}`.slice(0, 500),
        };
      } else {
        result = { status: "sent", providerId: info.messageId };
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
