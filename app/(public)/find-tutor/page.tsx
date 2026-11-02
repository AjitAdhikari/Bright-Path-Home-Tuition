import type { Metadata } from "next";
import { RequestForm } from "./RequestForm";
import { Badge } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Find a tutor",
  description:
    "Post what your child needs. We call to verify, then send 2–3 verified tutors. Free demo, pay only when you confirm.",
};

const assurances = [
  "We call you — no spam, no endless chat threads.",
  "Every tutor is ID-checked and interviewed.",
  "A free demo before you commit to anything.",
  "Not happy with a tutor? Free replacement.",
];

export default function FindTutorPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <div className="text-center">
        <Badge tone="brand">For parents</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Tell us what your child needs
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-600">
          One short form. No account, no payment. A real person reviews every
          request before any tutor is shared.
        </p>
      </div>

      <ul className="mx-auto mt-8 grid max-w-xl gap-2.5 sm:grid-cols-2">
        {assurances.map((a) => (
          <li key={a} className="flex items-start gap-2 text-sm text-ink-600">
            <span className="mt-0.5 text-brand-600">✓</span>
            {a}
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <RequestForm />
      </div>
    </div>
  );
}
