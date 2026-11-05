import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sidebar,
  MobileMenu,
  PageTitle,
  type NavItem,
  type NavGroup,
  type DashboardUser,
} from "@/components/dashboard/Nav";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export type { NavItem, NavGroup, DashboardUser };

/**
 * The one dashboard frame for admin, tutor and parent: navy sidebar with the
 * Bright Path mark, a header showing the current page, and the page content.
 * Each role's layout only passes its own links — either a flat `nav` list or
 * labelled `groups`. Colours come from `.dashboard-theme` in globals.css.
 *
 * The signed-in user's name is looked up here, so layouts don't have to.
 */
export async function DashboardShell({
  nav,
  groups,
  role,
  title,
  user,
  profileHref,
  children,
}: {
  nav?: NavItem[];
  groups?: NavGroup[];
  role: "Tutor" | "Parent" | "Admin";
  /** Header text when no nav link matches the current page. */
  title?: string;
  /** Pass to skip the lookup (e.g. if the layout already loaded it). */
  user?: DashboardUser;
  /** Shows a profile button (top right) linking here. */
  profileHref?: string;
  /** @deprecated No longer shown; kept so existing layouts still compile. */
  subtitle?: string;
  children: React.ReactNode;
}) {
  const navGroups: NavGroup[] = groups ?? [{ items: nav ?? [] }];
  const homeHref = navGroups[0]?.items[0]?.href ?? "/";
  const me = user ?? (await loadUser(role));
  const chrome = { groups: navGroups, role, homeHref, user: me };

  return (
    <div className="dashboard-theme flex min-h-dvh bg-background text-foreground">
      <Sidebar {...chrome} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-card">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-5 sm:px-8 lg:px-12">
            <MobileMenu {...chrome} />
            <div className="min-w-0 flex-1">
              <PageTitle groups={navGroups} fallback={title ?? role} />
            </div>
            <ThemeToggle className="min-h-9 px-3" />
            {profileHref && <ProfileButton href={profileHref} user={me} />}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Avatar + first name, linking to the user's profile page. */
function ProfileButton({ href, user }: { href: string; user: DashboardUser }) {
  // First letter of the first and last name: "Bikash KC" -> "BK".
  const parts = user.name.trim().split(/\s+/);
  const initials = (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
  return (
    <Link
      href={href}
      aria-label={`Your profile (${user.name})`}
      title={user.name}
      className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground ring-offset-2 ring-offset-card transition hover:ring-2 hover:ring-accent"
    >
      {initials || "?"}
    </Link>
  );
}

/** Name + email for the sidebar footer. Falls back quietly if unavailable. */
async function loadUser(role: string): Promise<DashboardUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { name: role };
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();
  const p = data as { full_name?: string | null; email?: string | null } | null;
  return { name: p?.full_name || role, email: p?.email ?? user.email ?? null };
}

export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  tone?: "brand" | "accent" | "ink";
}) {
  const tones = {
    brand: { text: "text-primary", chip: "bg-primary/10 text-primary" },
    accent: { text: "text-warning", chip: "bg-warning/10 text-warning" },
    ink: { text: "text-foreground", chip: "bg-muted text-foreground" },
  } as const;
  const t = tones[tone];
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
              t.chip
            )}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </span>
        )}
      </div>
      <p className={cn("mt-2 text-3xl font-extrabold tracking-tight", t.text)}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
