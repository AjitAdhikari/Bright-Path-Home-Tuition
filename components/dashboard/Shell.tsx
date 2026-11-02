import Link from "next/link";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: string };

/**
 * Shared dashboard chrome: a slim sidebar on desktop, a top bar on mobile.
 * `accent` tints the active item per role so the three areas feel distinct.
 */
export function DashboardShell({
  nav,
  title,
  role,
  children,
  active,
}: {
  nav: NavItem[];
  title: string;
  role: "Tutor" | "Parent" | "Admin";
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-ink-50">
      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-sidebar p-4 lg:flex">
          <div className="px-2 py-2">
            <Logo />
            <p className="mt-1 pl-11 text-xs font-medium text-ink-400">
              {role} space
            </p>
          </div>
          <nav className="mt-6 flex-1 space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active === item.href
                    ? "bg-brand-50 text-brand-800"
                    : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                )}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <form action="/auth/signout" method="post">
            <button className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900">
              ↩ Sign out
            </button>
          </form>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-border bg-card px-5 py-4 lg:px-8">
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {role[0]}
            </div>
          </header>
          <div className="p-5 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "brand" | "accent" | "ink";
}) {
  const tones = {
    brand: "text-brand-700",
    accent: "text-accent-600",
    ink: "text-ink-900",
  } as const;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-3xl font-extrabold", tones[tone])}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-400">{sub}</p>}
    </div>
  );
}
