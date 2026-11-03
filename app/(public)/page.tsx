import {
  ShieldCheck,
  PhoneCall,
  Star,
  BadgeCheck,
  Repeat,
  ClipboardList,
  Users,
  CalendarCheck,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Card, Badge } from "@/components/ui/Card";

const steps = [
  {
    n: "01",
    icon: ClipboardList,
    title: "Tell us what your child needs",
    body: "One short form — class, subjects, area and budget. No account needed. Takes a minute.",
  },
  {
    n: "02",
    icon: Users,
    title: "We call, then send 2–3 tutors",
    body: "A real person verifies your request, then hand-picks verified tutors near you — with photo, fees and ratings.",
  },
  {
    n: "03",
    icon: CalendarCheck,
    title: "Free demo, then you decide",
    body: "Meet a tutor for a demo class. Confirm only if you're happy. You pay the first month to us; the tutor is paid after they teach.",
  },
];

const trust = [
  { icon: BadgeCheck, label: "ID & certificate checked" },
  { icon: PhoneCall, label: "Interviewed before approval" },
  { icon: Star, label: "Rated by real parents" },
  { icon: Repeat, label: "Free replacement promise" },
];

const stats = [
  ["2,400+", "families matched"],
  ["600+", "verified tutors"],
  ["12", "cities & valleys"],
];

const areas = ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Butwal", "Birgunj"];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="gradient-mesh-bg absolute inset-0 -z-10" aria-hidden />
        <div className="bg-dotted absolute inset-0 -z-10 opacity-40" aria-hidden />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <div className="animate-rise">
            <Badge tone="brand">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Home tuition for Class 1 to Bachelor
            </Badge>
            <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Verified home tutors,{" "}
              <span className="gradient-brand-text">matched by a real person.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Tell us the class, subjects and area. We call you, share 2–3
              checked tutors, and your child tries a free demo class before you
              decide.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/find-tutor" size="lg">
                Find a tutor <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/become-tutor" variant="outline" size="lg">
                Become a tutor
              </ButtonLink>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                No fee to browse
              </span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>Free demo class</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>Pay only when you confirm</span>
            </div>
          </div>

          {/* Floating sample match card */}
          <div className="relative animate-rise [animation-delay:120ms]">
            <Card className="shadow-card">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-lg font-bold text-primary">
                  AS
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">Anita Sharma</p>
                  <p className="text-sm text-muted-foreground">
                    Maths & Science · SEE
                  </p>
                </div>
                <Badge tone="success">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified
                </Badge>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                {[
                  ["4.9★", "32 reviews"],
                  ["6 yrs", "experience"],
                  ["NPR 8k", "per month"],
                ].map(([top, bottom]) => (
                  <div key={bottom} className="rounded-xl bg-muted py-3">
                    <p className="font-bold text-foreground">{top}</p>
                    <p className="text-xs text-muted-foreground">{bottom}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
                <p className="text-sm font-medium text-primary">
                  Demo booked · Sat 4 PM
                </p>
                <Badge tone="brand">Baneshwor</Badge>
              </div>
            </Card>
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-border bg-card p-4 shadow-card sm:block">
              <p className="text-xs text-muted-foreground">This month</p>
              <p className="text-2xl font-extrabold text-primary">148</p>
              <p className="text-xs text-muted-foreground">tuitions confirmed</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────── */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-border px-5">
          {stats.map(([value, label]) => (
            <div key={label} className="px-4 py-8 text-center">
              <p className="font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
                {value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {trust.map((t) => (
            <div key={t.label} className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <t.icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-medium text-foreground">
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="accent">Simple by design</Badge>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From &ldquo;I need a tutor&rdquo; to the first class — in three steps
          </h2>
          <p className="mt-4 text-muted-foreground">
            The hard part is trust. We do that part for you with a phone call
            and real document checks.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.n} className="relative transition-shadow hover:shadow-card">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-heading text-4xl font-black text-primary/15">
                  {s.n}
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Areas ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-10">
        <Card className="bg-primary text-primary-foreground">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h3 className="flex items-center gap-2 font-heading text-xl font-bold">
                <MapPin className="h-5 w-5" aria-hidden /> Now serving
              </h3>
              <p className="mt-1 text-primary-foreground/80">
                New wards are added every week. Not listed? Post anyway — we&apos;ll
                try.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {areas.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium"
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
          <h2 className="relative font-heading text-3xl font-bold sm:text-4xl">
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
            <ButtonLink
              href="/how-it-works"
              variant="outline"
              size="lg"
              className="border-background/30 bg-transparent text-background hover:border-background hover:bg-background/10 hover:text-background"
            >
              See how it works
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
