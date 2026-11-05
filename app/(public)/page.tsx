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
  GraduationCap,
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

const areas = [
  "Kathmandu",
  "Lalitpur",
  "Bhaktapur",
  "Pokhara",
  "Butwal",
  "Birgunj",
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="gradient-mesh-bg absolute inset-0 -z-10" aria-hidden />
        <div
          className="bg-dotted absolute inset-0 -z-10 opacity-30"
          aria-hidden
        />

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 md:grid-cols-[1.05fr_0.95fr] md:py-28">
          <div className="animate-rise">
            <Badge tone="brand">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Home tuition for Class 1 to Bachelor
            </Badge>
            <h1 className="mt-5 font-heading text-4xl font-extrabold leading-[1.04] tracking-tight text-foreground sm:text-5xl md:text-[3.5rem]">
              Find the right tutor.
              <br />
              <span className="text-primary">Build a</span>{" "}
              <span className="relative inline-block">
                <span className="relative z-10">brighter future.</span>
                <span
                  className="absolute inset-x-0 bottom-1.5 -z-0 h-3 bg-accent/35"
                  aria-hidden
                />
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Discover verified home tutors for your child. Tell us what you
              need, and our team will personally connect you with the right
              educators.
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

          {/* Tutor profile preview — the visual focal point */}
          <div className="relative animate-rise [animation-delay:120ms]">
            <div
              className="absolute -right-6 -top-6 hidden h-28 w-28 rounded-full bg-secondary/10 blur-2xl md:block"
              aria-hidden
            />
            <Card className="relative shadow-card ring-1 ring-black/[0.03]">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  AS
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">Anita Sharma</p>
                  <p className="text-sm text-muted-foreground">
                    Maths &amp; Science · SEE
                  </p>
                </div>
                <Badge tone="success">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified
                </Badge>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-secondary" aria-hidden />
                Baneshwor, Kathmandu
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[
                  ["4.9★", "32 reviews"],
                  ["6 yrs", "experience"],
                  ["NPR 8k", "per month"],
                ].map(([top, bottom]) => (
                  <div
                    key={bottom}
                    className="rounded-xl bg-muted py-3"
                  >
                    <p className="font-bold text-foreground">{top}</p>
                    <p className="text-xs text-muted-foreground">{bottom}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl border border-dashed border-secondary/40 bg-secondary/5 px-4 py-3">
                <p className="text-sm font-medium text-secondary">
                  Demo booked · Sat 4 PM
                </p>
                <Badge tone="brand">Baneshwor</Badge>
              </div>
            </Card>
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-border bg-card p-4 shadow-card sm:block">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-secondary" aria-hidden />
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
              <p className="mt-1 text-2xl font-extrabold text-primary">148</p>
              <p className="text-xs text-muted-foreground">
                tuitions confirmed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats + trust band ─────────────────────────── */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid grid-cols-3 divide-x divide-border">
            {stats.map(([value, label]) => (
              <div key={label} className="px-4 py-8 text-center">
                <p className="font-heading text-3xl font-extrabold text-primary sm:text-4xl">
                  {value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-5 border-t border-border py-8 md:grid-cols-4">
            {trust.map((t) => (
              <div key={t.label} className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary/10 text-secondary">
                  <t.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
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

        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          {/* subtle connecting line */}
          <div
            className="absolute left-0 right-0 top-[2.1rem] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
            aria-hidden
          />
          {steps.map((s) => (
            <div key={s.n} className="relative">
              <div className="mb-5 flex items-center gap-4">
                <span className="relative z-10 grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
                  <s.icon className="h-6 w-6" aria-hidden />
                </span>
                <span className="font-heading text-5xl font-extrabold text-primary/10">
                  {s.n}
                </span>
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Areas ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-10">
        <div className="gradient-brand relative overflow-hidden rounded-3xl px-6 py-10 text-primary-foreground sm:px-8 sm:py-12">
          <div
            className="bg-dotted absolute inset-0 opacity-[0.07]"
            aria-hidden
          />
          <div className="relative flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left">
            <div className="max-w-sm">
              <h3 className="flex items-center justify-center gap-2 font-heading text-2xl font-bold md:justify-start">
                <MapPin className="h-5 w-5 text-accent" aria-hidden /> Now
                serving
              </h3>
              <p className="mt-2 text-primary-foreground/75">
                New wards are added every week. Not listed? Post anyway —
                we&apos;ll try.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2.5">
              {areas.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-12 text-center sm:px-8 sm:py-16">
          <div
            className="gradient-mesh-bg absolute inset-0 opacity-70"
            aria-hidden
          />
          <div className="relative">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Give your child the right guidance.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Find trusted educators who make learning easier, more personal,
              and more effective.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/find-tutor" size="lg">
                Find a tutor <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/how-it-works" variant="outline" size="lg">
                See how it works
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
