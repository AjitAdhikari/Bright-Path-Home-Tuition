import type { Metadata } from "next";
import { TutorForm } from "./TutorForm";
import { Badge } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Become a tutor",
  description:
    "Join Bright Path as a verified tutor. Get steady students near you, paid on time. Register, verify your documents, and start receiving leads.",
};

const perks = [
  ["Steady leads near you", "We send students that match your subjects and area."],
  ["Paid on time", "You teach, we handle the money and chase payments."],
  ["Your reputation grows", "Good reviews push you up the list parents see."],
];

export default function BecomeTutorPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <div className="text-center">
        <Badge tone="accent">For tutors</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Teach more. Chase less.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-600">
          Bright Path brings you verified students near you. You focus on teaching —
          we handle matching, trust and payments.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {perks.map(([t, b]) => (
          <div key={t} className="rounded-2xl border border-ink-200 bg-card p-4">
            <p className="font-semibold text-ink-900">{t}</p>
            <p className="mt-1 text-sm text-ink-600">{b}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <TutorForm />
      </div>
    </div>
  );
}
