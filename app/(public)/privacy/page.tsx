import type { Metadata } from "next";
import { Badge } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Bright Path collects, uses and protects your personal information.",
};

const sections = [
  [
    "What we collect",
    "For parents: your name, phone number, your child's class and subjects, your area and approximate budget. For tutors: your name, contact details, qualifications, and identity documents you upload.",
  ],
  [
    "How we use it",
    "To match your request with suitable tutors, to call and verify details, and to arrange demos and payments. We never sell your data.",
  ],
  [
    "What stays private",
    "Your full address and phone number are shared with a tutor only after you confirm a match. Tutor identity documents are visible to our admin team only, through short-lived secure links — never to other tutors or parents.",
  ],
  [
    "Tutor documents",
    "Uploaded IDs and certificates are stored in a private, access-controlled bucket. We use them for verification and keep them only as long as needed.",
  ],
  [
    "Your choices",
    "You can ask us to update or delete your information at any time by contacting hello@setu.com.np.",
  ],
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <Badge tone="neutral">Legal</Badge>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
        Privacy policy
      </h1>
      <p className="mt-3 text-ink-500">
        Plain-language summary. Last updated 31 Oct 2026.
      </p>

      <div className="mt-10 space-y-8">
        {sections.map(([t, b]) => (
          <section key={t}>
            <h2 className="text-lg font-bold text-ink-900">{t}</h2>
            <p className="mt-2 leading-relaxed text-ink-600">{b}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
