import { ShieldCheck, Sparkles, HandCoins } from "lucide-react";
import { Logo } from "@/components/Logo";

const TRUST = [
  { icon: ShieldCheck, label: "Verified tutors" },
  { icon: Sparkles, label: "Free demo class" },
  { icon: HandCoins, label: "Pay when you confirm" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 text-primary-foreground lg:flex">
        {/* layered background: burgundy gradient + dotted texture + soft glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(150deg, var(--primary) 0%, color-mix(in oklab, var(--primary) 78%, #000) 100%)",
          }}
          aria-hidden
        />
        <div className="bg-dotted absolute inset-0 opacity-[0.12]" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--secondary) 70%, transparent) 0%, transparent 70%)",
          }}
          aria-hidden
        />

        <Logo className="relative [&_span]:text-primary-foreground [&_b]:text-primary-foreground" />

        <div className="relative max-w-md">
          <figure>
            <span
              className="font-heading block text-6xl leading-none text-primary-foreground/25"
              aria-hidden
            >
              &ldquo;
            </span>
            <blockquote className="font-heading -mt-4 text-[1.75rem] font-semibold leading-snug">
              Where trusted tutors and families find each other.
            </blockquote>
            <figcaption className="mt-5 text-[0.95rem] leading-relaxed text-primary-foreground/80">
              Bright Path connects qualified, background-checked tutors with
              families across Nepal. Every tutor is vetted and
              interview-screened — so parents choose with confidence, and tutors
              reach students who value their work.
            </figcaption>
          </figure>
        </div>

        <ul className="relative flex flex-wrap gap-2.5">
          {TRUST.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm"
            >
              <Icon className="h-4 w-4 text-primary-foreground/90" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
