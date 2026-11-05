import { ThemeToggle } from "@/components/ThemeToggle";
import {
  AdminSidebar,
  AdminMobileMenu,
  AdminPageTitle,
  type AdminNavGroup,
} from "@/components/admin/AdminNav";

export type { AdminNavGroup };

// Admin-only chrome. Tutor and parent dashboards still use DashboardShell.
export function AdminShell({
  groups,
  user,
  children,
}: {
  groups: AdminNavGroup[];
  user: { name: string; email?: string | null };
  children: React.ReactNode;
}) {
  return (
    <div className="admin-theme flex min-h-dvh bg-background text-foreground">
      <AdminSidebar groups={groups} user={user} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-card">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-5 sm:px-8 lg:px-12">
            <AdminMobileMenu groups={groups} user={user} />
            <div className="min-w-0 flex-1">
              <AdminPageTitle />
            </div>
            <ThemeToggle className="min-h-9 px-3" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
