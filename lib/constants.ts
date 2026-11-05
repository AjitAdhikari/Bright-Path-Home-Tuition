/** Shared domain vocabulary — mirrors the Postgres enums in the migrations. */

export const SITE = {
  name: "Bright Path",
  fullName: "Bright Path Home Tuition",
  tagline: "Verified home tutors, matched by people who call first.",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "9779704121935",
} as const;

export const CASE_STATUS = [
  "new",
  "verified",
  "tutors_shared",
  "demo_scheduled",
  "demo_done",
  "confirmed",
  "active",
  "replacement",
  "closed",
] as const;
export type CaseStatus = (typeof CASE_STATUS)[number];

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  new: "New",
  verified: "Verified",
  tutors_shared: "Tutors shared",
  demo_scheduled: "Demo scheduled",
  demo_done: "Demo done",
  confirmed: "Confirmed",
  active: "Active",
  replacement: "Replacement",
  closed: "Closed",
};

export const VERIFICATION_STATUS = [
  "pending",
  "needs_info",
  "approved",
  "rejected",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUS)[number];

/** Tutor-application lifecycle — see the `application_status` enum in 0001. */
export const APPLICATION_STATUS = [
  "pending_review",
  "under_review",
  "changes_requested",
  "approved",
  "rejected",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUS)[number];

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending_review: "Pending review",
  under_review: "Under review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
};

export const APPLICATION_STATUS_TONE: Record<
  ApplicationStatus,
  "warning" | "success" | "neutral" | "danger" | "brand"
> = {
  pending_review: "warning",
  under_review: "brand",
  changes_requested: "warning",
  approved: "success",
  rejected: "danger",
};

/**
 * Verification-document catalogue — the single source of truth shared by the
 * tutor upload page, the upload server action (backend validation), and the
 * admin documents view. `mimes`/`exts` are validated on BOTH ends.
 */
export const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5 MB

export type DocRequirement = "required" | "optional";

export type DocTypeSpec = {
  type: string; // matches the Postgres doc_type enum
  label: string;
  requirement: DocRequirement;
  multiple: boolean;
  note: string;
  accept: string; // for the <input accept="…">
  mimes: string[];
  exts: string[];
};

const PDF = "application/pdf";
const DOC = "application/msword";
const DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const JPEG = "image/jpeg";
const PNG = "image/png";

export const DOC_TYPES: DocTypeSpec[] = [
  {
    type: "cv",
    label: "CV / Resume",
    requirement: "required",
    multiple: false,
    note: "PDF, DOC or DOCX · up to 5 MB",
    accept: ".pdf,.doc,.docx",
    mimes: [PDF, DOC, DOCX],
    exts: ["pdf", "doc", "docx"],
  },
  {
    type: "experience_letter",
    label: "Experience Letter",
    requirement: "optional",
    multiple: true,
    note: "PDF, JPG or PNG · you may add more than one",
    accept: ".pdf,.jpg,.jpeg,.png",
    mimes: [PDF, JPEG, PNG],
    exts: ["pdf", "jpg", "jpeg", "png"],
  },
  {
    type: "citizenship",
    label: "Citizenship / National ID",
    requirement: "required",
    multiple: false,
    note: "PDF, JPG or PNG · up to 5 MB",
    accept: ".pdf,.jpg,.jpeg,.png",
    mimes: [PDF, JPEG, PNG],
    exts: ["pdf", "jpg", "jpeg", "png"],
  },
  {
    type: "academic_certificate",
    label: "Academic Certificates",
    requirement: "required",
    multiple: true,
    note: "PDF, JPG or PNG · add each certificate",
    accept: ".pdf,.jpg,.jpeg,.png",
    mimes: [PDF, JPEG, PNG],
    exts: ["pdf", "jpg", "jpeg", "png"],
  },
  {
    type: "training_certificate",
    label: "Training Certificates",
    requirement: "optional",
    multiple: true,
    note: "Optional · PDF, JPG or PNG",
    accept: ".pdf,.jpg,.jpeg,.png",
    mimes: [PDF, JPEG, PNG],
    exts: ["pdf", "jpg", "jpeg", "png"],
  },
  {
    type: "other",
    label: "Other Supporting Documents",
    requirement: "optional",
    multiple: true,
    note: "Optional · PDF, JPG or PNG",
    accept: ".pdf,.jpg,.jpeg,.png",
    mimes: [PDF, JPEG, PNG],
    exts: ["pdf", "jpg", "jpeg", "png"],
  },
];

export const DOC_TYPE_MAP: Record<string, DocTypeSpec> = Object.fromEntries(
  DOC_TYPES.map((d) => [d.type, d])
);

/** Legacy labels for doc_type values no longer offered in the UI but that may
 *  still exist on old rows, so the admin view can still name them. */
export const LEGACY_DOC_LABELS: Record<string, string> = {
  certificate: "Academic certificate",
  police_report: "Police character report",
  photo: "Recent photograph",
};

export const BOARDS = ["NEB", "CBSE", "Cambridge", "Other"] as const;

export const LEVELS = [
  "Class 1–5",
  "Class 6–8",
  "SEE (Class 9–10)",
  "+2 Science",
  "+2 Management",
  "Bachelor",
  "IELTS / Test prep",
  "Computer",
  "Music",
] as const;

export const SUBJECTS = [
  "Maths",
  "Science",
  "English",
  "Nepali",
  "Physics",
  "Chemistry",
  "Biology",
  "Accountancy",
  "Economics",
  "Computer",
  "Social Studies",
] as const;

export const TIME_SLOTS = ["Morning", "Day", "Evening"] as const;
export const MODES = ["Home", "Online"] as const;
export const GENDER_PREF = ["Any", "Male", "Female"] as const;

export const COMMISSION_RATE = 0.5; // 50% of the first month

/**
 * Manual QR payment details. Parents scan the QR (Fonepay/eSewa/bank),
 * pay the first month, then send us the screenshot on WhatsApp — there is
 * no online gateway. Set the real values in `.env` before launch; the
 * fallbacks only keep the UI sensible in development.
 */
export const PAYMENT = {
  /** Image dropped in `public/` — a Fonepay/eSewa QR exported from the app. */
  qrImage: process.env.NEXT_PUBLIC_PAYMENT_QR ?? "/payment-qr.png",
  payeeName: process.env.NEXT_PUBLIC_PAYEE_NAME ?? SITE.fullName,
  /** eSewa ID / Fonepay number shown as a fallback if the QR won't scan. */
  esewaId: process.env.NEXT_PUBLIC_ESEWA_ID ?? SITE.whatsapp,
  bankNote:
    process.env.NEXT_PUBLIC_BANK_NOTE ??
    "Or ask us for bank transfer details on WhatsApp.",
} as const;
