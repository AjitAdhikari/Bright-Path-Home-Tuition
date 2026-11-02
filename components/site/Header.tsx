import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";

const nav = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/become-tutor", label: "For tutors" },
  { href: "/fees-and-terms", label: "Fees" },
  { href: "/about", label: "Safety" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Logo />

        <nav
          className="hidden items-center gap-7 text-[15px] font-semibold md:flex"
          aria-label="Main"
        >
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-ink-900 transition-colors hover:text-brand-700"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="hidden min-h-11 items-center rounded-full border border-border px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:inline-flex"
          >
            EN · <span className="font-devanagari ml-1">नेपाली</span>
          </button>
          <ButtonLink
            href="/login"
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Log in
          </ButtonLink>
          <ButtonLink href="/find-tutor" variant="primary" size="sm">
            Find a tutor
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
