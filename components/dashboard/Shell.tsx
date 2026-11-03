import { type LucideIcon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SidebarBody, MobileNav, type NavItem } from "@/components/dashboard/Nav";
import { cn } from "@/lib/utils";

export type { NavItem };

/**
 * Shared dashboard chrome: a fixed sidebar on desktop, a top bar + slide-over
 * drawer on mobile. The active nav item is derived from the URL inside `Nav`,
 * so pages don't need to pass it.
 */
export function DashboardShell({
  nav,
  title,
  subtitle,
  role,
  children,
}: {
  nav: NavItem[];
  title: string;
  subtitle?: string;
  role: "Tutor" | "Parent" | "Admin";
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-5 lg:flex">
          <div className="px-2">
            <Logo />
            <p className="mt-1 pl-11 text-xs font-medium text-muted-foreground">
              {role} space
            </p>
          </div>
          <SidebarBody nav={nav} />
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile chrome */}
          <MobileNav nav={nav} role={role} title={title} />

          {/* Desktop header */}
          <header className="hidden items-center justify-between border-b border-border bg-card px-8 py-5 lg:flex">
            <div>
              <h1 className="text-lg font-bold text-foreground">{title}</h1>
              {subtitle && (
                <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {role[0]}
            </div>
          </header>

          <main className="p-5 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
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
