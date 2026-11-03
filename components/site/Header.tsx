"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";

const nav = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/become-tutor", label: "For tutors" },
  { href: "/fees-and-terms", label: "Fees" },
  { href: "/about", label: "Safety" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Logo />

        <nav
          className="hidden items-center gap-8 text-[15px] font-medium md:flex"
          aria-label="Main"
        >
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="relative text-foreground/80 transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="hidden min-h-10 items-center rounded-full border border-border px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted lg:inline-flex"
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
          <ButtonLink
            href="/find-tutor"
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Find a tutor
          </ButtonLink>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-11 w-11 place-items-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted md:hidden"
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav sheet */}
      {open && (
        <div
          id="mobile-nav"
          className="animate-rise border-t border-border bg-background/95 px-5 py-4 backdrop-blur-xl md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2.5 border-t border-border pt-4">
            <ButtonLink
              href="/find-tutor"
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Find a tutor
            </ButtonLink>
            <ButtonLink
              href="/become-tutor"
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Become a tutor
            </ButtonLink>
            <ButtonLink
              href="/login"
              variant="ghost"
              size="md"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Log in
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
