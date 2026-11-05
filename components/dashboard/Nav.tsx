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
import { cn } from "@/lib/utils";

/**
 * Icons are resolved by name on the client. Server components (the layouts)
 * can't pass lucide component objects across the boundary — only strings.
 */
const ICONS = {
  dashboard: LayoutDashboard,
  cases: FolderOpen,
  applications: ClipboardList,
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
export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Optional "waiting" number shown as a badge next to the link. */
  count?: number;
};
/** A labelled section of links. Leave `label` empty for an unlabelled list. */
export type NavGroup = { label?: string; items: NavItem[] };
export type DashboardUser = { name: string; email?: string | null };

type Chrome = {
  groups: NavGroup[];
  role: string;
  homeHref: string;
  user: DashboardUser;
};

/** Longest matching href wins, so `/admin` isn't "active" on `/admin/requests`. */
function useActiveItem(groups: NavGroup[]) {
  const pathname = usePathname();
  let best: NavItem | null = null;
  for (const g of groups)
    for (const item of g.items) {
      const hit = pathname === item.href || pathname.startsWith(item.href + "/");
      if (hit && item.href.length > (best?.href.length ?? 0)) best = item;
    }
  return best;
}

function NavList({
  groups,
  role,
  onNavigate,
}: {
  groups: NavGroup[];
  role: string;
  onNavigate?: () => void;
}) {
  const activeHref = useActiveItem(groups)?.href;
  return (
    <nav aria-label={role} className="space-y-7">
      {groups.map((group, gi) => (
        <div key={group.label ?? gi}>
          {group.label && (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.href === activeHref;
              const Icon: LucideIcon = ICONS[item.icon];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm transition-colors",
                      active
                        ? "border-sidebar-primary bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                        : "border-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active && "text-sidebar-primary")} aria-hidden />
                    <span className="flex-1 truncate">{item.label}</span>
                    {!!item.count && (
                      <span className="min-w-5 rounded-full bg-sidebar-primary px-1.5 text-center text-[11px] font-semibold leading-5 tabular-nums text-sidebar-primary-foreground">
                        {item.count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// Simplified logo mark: rising sun over a winding path.
function BrandMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden className="shrink-0">
      <rect width="34" height="34" rx="9" fill="#ffffff" fillOpacity="0.08" />
      <g stroke="#f9b233" strokeWidth="1.8" strokeLinecap="round">
        <path d="M17 5.5v3" />
        <path d="M10.5 8l1.6 2.3" />
        <path d="M23.5 8l-1.6 2.3" />
        <path d="M7.5 13l2.5 1" />
        <path d="M26.5 13l-2.5 1" />
      </g>
      <path d="M11 17a6 6 0 0 1 12 0z" fill="#f9b233" />
      <path
        d="M9 18.2c4-.9 9-.9 13-.3-4 .8-7.2 2.4-7.2 5.2 0 2.3 2.4 4.1 5.6 5.4h-4.2c-2.8-1.3-4.4-3.2-4.4-5.3 0-2 1.2-3.7 3.2-4.5-2 .1-4 .1-6-.5z"
        fill="#ffffff"
      />
    </svg>
  );
}

function Brand({ role, homeHref }: { role: string; homeHref: string }) {
  return (
    <Link href={homeHref} className="flex items-center gap-3 px-3">
      <BrandMark />
      <span className="min-w-0">
        <span className="block font-heading text-[17px] font-bold leading-tight text-sidebar-foreground">
          Bright <span className="text-sidebar-primary">Path</span>
        </span>
        <span className="block text-xs text-sidebar-foreground/55">{role}</span>
      </span>
    </Link>
  );
}

function Footer({ user }: { user: DashboardUser }) {
  return (
    <div className="border-t border-sidebar-border px-3 pt-4">
      <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
      {user.email && <p className="truncate text-xs text-sidebar-foreground/55">{user.email}</p>}
      <form action="/auth/signout" method="post" className="mt-3">
        <button className="inline-flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-primary">
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </form>
    </div>
  );
}

/** Desktop sidebar (hidden below `lg`, where the mobile menu takes over). */
export function Sidebar({ groups, role, homeHref, user }: Chrome) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-7 lg:flex">
      <Brand role={role} homeHref={homeHref} />
      <div className="mt-9 flex-1 overflow-y-auto">
        <NavList groups={groups} role={role} />
      </div>
      <Footer user={user} />
    </aside>
  );
}

/** Menu button + slide-over drawer for phones and tablets. */
export function MobileMenu({ groups, role, homeHref, user }: Chrome) {
  const [open, setOpen] = useState(false);

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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="-ml-2 grid h-10 w-10 place-items-center rounded-md text-foreground hover:bg-muted lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="flex h-dvh w-64 max-w-[85%] flex-col border-r border-sidebar-border bg-sidebar px-3 py-6">
            <div className="flex items-start justify-between">
              <Brand role={role} homeHref={homeHref} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-8 w-8 place-items-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="mt-8 flex-1 overflow-y-auto">
              <NavList groups={groups} role={role} onNavigate={() => setOpen(false)} />
            </div>
            <Footer user={user} />
          </div>
        </div>
      )}
    </>
  );
}

/** Header title: the label of the active nav link, else the fallback. */
export function PageTitle({ groups, fallback }: { groups: NavGroup[]; fallback: string }) {
  const active = useActiveItem(groups);
  return (
    <h1 className="truncate text-base font-semibold text-foreground">
      {active?.label ?? fallback}
    </h1>
  );
}
