import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SITE } from "@/lib/constants";

const columns = [
  {
    title: "For parents",
    links: [
      { href: "/find-tutor", label: "Find a tutor" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/fees-and-terms", label: "Fees & terms" },
    ],
  },
  {
    title: "For tutors",
    links: [
      { href: "/become-tutor", label: "Become a tutor" },
      { href: "/login", label: "Tutor login" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/privacy", label: "Privacy policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-ink-600">
            Verified home tutors for your child, matched by a real person. We
            call before we match — and you only pay after a free demo you are
            happy with.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold text-ink-900">{col.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-ink-500 transition-colors hover:text-brand-700"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-ink-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.fullName}. Made in Nepal.
          </p>
          <div className="flex items-center gap-4 sm:justify-end">
            <p>Verified tutors · Free demo · Pay only when you confirm.</p>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
