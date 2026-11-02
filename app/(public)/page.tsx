import { ButtonLink } from "@/components/ui/Button";
import { Card, Badge } from "@/components/ui/Card";

const steps = [
  {
    n: "01",
    title: "Tell us what your child needs",
    body: "One short form — class, subjects, area and budget. No account needed. Takes a minute.",
  },
  {
    n: "02",
    title: "We call, then send 2–3 tutors",
    body: "A real person verifies your request, then hand-picks verified tutors near you — with photo, fees and ratings.",
  },
  {
    n: "03",
    title: "Free demo, then you decide",
    body: "Meet a tutor for a demo class. Confirm only if you're happy. You pay the first month to us; the tutor is paid after they teach.",
  },
];

const trust = [
  { label: "ID & certificate checked", icon: "shield" },
  { label: "Interviewed before approval", icon: "chat" },
  { label: "Rated by real parents", icon: "star" },
  { label: "Free replacement promise", icon: "swap" },
];

const areas = ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Butwal", "Birgunj"];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="bg-dotted absolute inset-0 opacity-50" aria-hidden />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-100 blur-3xl" aria-hidden />
        <div className="absolute -left-32 top-40 h-80 w-80 rounded-full bg-accent-100 blur-3xl" aria-hidden />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <div className="animate-rise">
            <Badge tone="brand">Home tuition for Class 1 to Bachelor</Badge>
            <h1 className="font-display mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl md:text-6xl">
              Verified home tutors for your child,{" "}
              <span className="text-brand-700">matched by a real person.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-600">
              Tell us the class, subjects and area. We call you, share 2–3
              checked tutors, and your child tries a demo class before you
              decide.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/find-tutor" size="lg">
                Find a tutor →
              </ButtonLink>
              <ButtonLink href="/become-tutor" variant="outline" size="lg">
                Become a tutor
              </ButtonLink>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-500">
              <span className="font-semibold text-ink-700">No fee to browse</span>
              <span className="h-1 w-1 rounded-full bg-ink-300" />
              <span>Free demo class</span>
              <span className="h-1 w-1 rounded-full bg-ink-300" />
              <span>Pay only when you confirm</span>
            </div>
          </div>

          {/* Floating sample match card */}
          <div className="relative animate-rise [animation-delay:120ms]">
            <Card className="shadow-lift">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
                  AS
                </div>
                <div>
                  <p className="font-semibold text-ink-900">Anita Sharma</p>
                  <p className="text-sm text-ink-500">Maths & Science · SEE</p>
                </div>
                <Badge tone="success">✓ Verified</Badge>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                {[
                  ["4.9★", "32 reviews"],
                  ["6 yrs", "experience"],
                  ["NPR 8k", "per month"],
                ].map(([top, bottom]) => (
                  <div key={bottom} className="rounded-xl bg-ink-50 py-3">
                    <p className="font-bold text-ink-900">{top}</p>
                    <p className="text-xs text-ink-500">{bottom}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl border border-dashed border-brand-200 bg-brand-50 px-4 py-3">
                <p className="text-sm font-medium text-brand-800">
                  Demo booked · Sat 4 PM
                </p>
                <Badge tone="brand">Baneshwor</Badge>
              </div>
            </Card>
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl bg-card p-4 shadow-lift sm:block">
              <p className="text-xs text-ink-500">This month</p>
              <p className="text-2xl font-extrabold text-brand-700">148</p>
              <p className="text-xs text-ink-500">tuitions confirmed</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────── */}
      <section className="border-y border-ink-100 bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4">
          {trust.map((t) => (
            <div key={t.label} className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Checkmark />
              </span>
              <span className="text-sm font-medium text-ink-700">{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="accent">Simple by design</Badge>
          <h2 className="font-display mt-4 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            From &ldquo;I need a tutor&rdquo; to the first class — in three steps
          </h2>
          <p className="mt-4 text-ink-600">
            The hard part is trust. We do that part for you with a phone call
            and real document checks.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.n} className="relative transition-shadow hover:shadow-lift">
              <span className="text-5xl font-black text-primary/25">{s.n}</span>
              <h3 className="font-display mt-2 text-lg font-bold text-ink-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{s.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Areas ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-10">
        <Card className="bg-primary text-primary-foreground">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h3 className="font-display text-xl font-bold">Now serving</h3>
              <p className="mt-1 text-primary-foreground/80">
                New wards are added every week. Not listed? Post anyway — we&apos;ll try.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {areas.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-foreground px-8 py-16 text-center text-background">
          <div className="bg-dotted absolute inset-0 opacity-10" aria-hidden />
          <h2 className="relative font-display text-3xl font-bold sm:text-4xl">
            Ready when you are.
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-background/70">
            Post your requirement now. We&apos;ll call you within a few hours —
            often the same day.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/find-tutor" variant="accent" size="lg">
              Post a requirement
            </ButtonLink>
            <ButtonLink href="/how-it-works" variant="outline" size="lg" className="border-background/30 bg-transparent text-background hover:border-background hover:bg-background/10 hover:text-background">
              See how it works
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

function Checkmark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
