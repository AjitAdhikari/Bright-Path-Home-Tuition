/** Shared domain vocabulary — mirrors the Postgres enums in the migrations. */

export const SITE = {
  name: "Bright Path",
  fullName: "Bright Path Home Tuition",
  tagline: "Verified home tutors, matched by people who call first.",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "9779800000000",
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
