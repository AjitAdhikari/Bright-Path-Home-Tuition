import type { Metadata } from "next";
import { Card, Badge } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How Bright Path matches parents with verified tutors — step by step for both parents and tutors.",
};

const parentSteps = [
  ["Post a requirement", "Fill one short form — class, subjects, area, budget. No account, no payment."],
  ["We verify by phone", "A real person calls within a few hours to confirm details and filter out casual requests."],
  ["Get 2–3 tutor profiles", "We hand-pick verified tutors near you, sent by WhatsApp or on the site."],
  ["Book a free demo", "Choose a tutor and schedule a demo class. We remind both sides a day before."],
  ["Confirm & pay", "Happy? Confirm the tutor and pay the first month through Bright Path — the agreed fee, schedule and start date in writing."],
  ["Classes & feedback", "Regular classes run. We check in monthly, and you can request a replacement anytime."],
];

const tutorSteps = [
  ["Register", "Sign up with your details and teaching profile."],
  ["Get verified", "Upload your ID and certificate; a short interview call. You go live only after approval."],
  ["Receive leads", "We send matching student requests by SMS, WhatsApp and your dashboard."],
  ["Demo & confirm", "Teach a demo. If the parent confirms, your first-month commission is settled."],
  ["Teach & grow", "Mark attendance, share monthly progress, collect reviews that raise your ranking."],
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <div className="text-center">
        <Badge tone="brand">How it works</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Trust, built into every step
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-600">
          The hard part of finding a tutor is knowing who to trust. We do that
          work with real phone calls and real document checks.
        </p>
      </div>

      <section className="mt-14">
        <h2 className="text-xl font-bold text-ink-900">For parents</h2>
        <ol className="mt-5 space-y-3">
          {parentSteps.map(([t, b], i) => (
            <li key={t}>
              <Card className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-ink-900">{t}</p>
                  <p className="mt-0.5 text-sm text-ink-600">{b}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-bold text-ink-900">For tutors</h2>
        <ol className="mt-5 space-y-3">
          {tutorSteps.map(([t, b], i) => (
            <li key={t}>
              <Card className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-ink-900">{t}</p>
                  <p className="mt-0.5 text-sm text-ink-600">{b}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-14 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/find-tutor" size="lg">Find a tutor</ButtonLink>
        <ButtonLink href="/become-tutor" variant="outline" size="lg">Become a tutor</ButtonLink>
      </div>
    </div>
  );
}
