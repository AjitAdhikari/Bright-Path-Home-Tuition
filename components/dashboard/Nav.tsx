"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  FolderOpen,
  UserCheck,
  Banknote,
  Home,
  User,
  Paperclip,
  BookOpen,
  Wallet,
  ClipboardList,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

/**
 * Icons are resolved by name on the client. Server components (the layouts)
 * can't pass lucide component objects across the boundary — only strings.
 */
const ICONS = {
  dashboard: LayoutDashboard,
  cases: FolderOpen,
  tutors: UserCheck,
  payments: Banknote,
  home: Home,
  profile: User,
  documents: Paperclip,
  tuitions: BookOpen,
  earnings: Wallet,
  requests: ClipboardList,
  add: Plus,
} as const;

export type IconName = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon: IconName };

/** Longest matching href wins, so `/admin` isn't "active" on `/admin/requests`. */
function useActiveHref(nav: NavItem[]) {
  const pathname = usePathname();
  let best = "";
  for (const item of nav) {
    const match =
      pathname === item.href || pathname.startsWith(item.href + "/");
    if (match && item.href.length > best.length) best = item.href;
  }
  return best;
}

function NavLinks({
  nav,
  activeHref,
  onNavigate,
}: {
  nav: NavItem[];
  activeHref: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {nav.map((item) => {
        const active = item.href === activeHref;
        const Icon: LucideIcon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {/* Active rail */}
            <span
              className={cn(
                "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary transition-opacity",
                active ? "opacity-100" : "opacity-0"
              )}
              aria-hidden
            />
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-transform",
                !active && "group-hover:scale-110"
              )}
              aria-hidden
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SignOut() {
  return (
    <form action="/auth/signout" method="post">
      <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
        <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
        Sign out
      </button>
    </form>
  );
}

/** Desktop sidebar body: links + sign-out, shown inside the <aside>. */
export function SidebarBody({ nav }: { nav: NavItem[] }) {
  const activeHref = useActiveHref(nav);
  return (
    <>
      <div className="mt-6 flex-1">
        <NavLinks nav={nav} activeHref={activeHref} />
      </div>
      <div className="border-t border-border pt-3">
        <SignOut />
      </div>
    </>
  );
}

/** Mobile top bar + slide-over drawer (phones have no sidebar otherwise). */
export function MobileNav({
  nav,
  role,
  title,
}: {
  nav: NavItem[];
  role: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const activeHref = useActiveHref(nav);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid h-10 w-10 place-items-center rounded-xl text-foreground transition-colors hover:bg-muted"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <h1 className="truncate text-base font-bold text-foreground">{title}</h1>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
          {role[0]}
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="animate-rise flex h-dvh w-72 max-w-[82%] flex-col bg-sidebar p-4 shadow-card">
            <div className="flex items-center justify-between px-2 py-1">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <p className="mb-4 pl-2 text-xs font-medium text-muted-foreground">
              {role} space
            </p>
            <div className="flex-1 overflow-y-auto">
              <NavLinks
                nav={nav}
                activeHref={activeHref}
                onNavigate={() => setOpen(false)}
              />
            </div>
            <div className="border-t border-border pt-3">
              <SignOut />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
