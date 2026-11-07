import { DashboardShell, type NavGroup } from "@/components/dashboard/Shell";
import { createClient } from "@/lib/supabase/server";
import { getAdminSidebarCounts } from "@/lib/lookups";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admin name for the sidebar (per-admin, uncached) plus the shared "waiting"
  // badge counts (cached briefly — see getAdminSidebarCounts).
  const [profile, counts] = await Promise.all([
    user
      ? supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getAdminSidebarCounts(),
  ]);

  const p = profile.data as { full_name?: string; email?: string } | null;
  const me = {
    name: p?.full_name || "Admin",
    email: p?.email ?? user?.email ?? null,
  };

  const groups: NavGroup[] = [
    {
      label: "Workspace",
      items: [{ href: "/admin", label: "Overview", icon: "dashboard" }],
    },
    {
      label: "Operations",
      items: [
        {
          href: "/admin/requests",
          label: "Cases",
          icon: "cases",
          count: counts.newCases,
        },
        { href: "/admin/payments", label: "Payments", icon: "payments", count: counts.pendingPayments },
      ],
    },
    {
      label: "Tutors",
      items: [
        {
          href: "/admin/applicants",
          label: "Applications",
          icon: "applications",
          count: counts.openApps,
        },
        {
          href: "/admin/tutors",
          label: "Tutor approvals",
          icon: "tutors",
          count: counts.pendingTutors,
        },
      ],
    },
  ];

  return (
    <DashboardShell role="Admin" groups={groups} user={me}>
      {children}
    </DashboardShell>
  );
}
