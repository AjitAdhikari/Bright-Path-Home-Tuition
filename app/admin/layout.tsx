import { AdminShell, type AdminNavGroup } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/server";

const OPEN_APPLICATION_STATUSES = [
  "pending_review",
  "under_review",
  "changes_requested",
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admin name for the sidebar, plus the "waiting" counts shown next to each
  // link. If a count query fails the number is simply left out.
  const [profile, newCases, openApps, pendingTutors, pendingPayments] =
    await Promise.all([
      user
        ? supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      supabase
        .from("tutor_applicants")
        .select("id", { count: "exact", head: true })
        .in("status", OPEN_APPLICATION_STATUSES),
      supabase
        .from("tutor_profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("verification_status", "pending"),
      supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  const p = profile.data as { full_name?: string; email?: string } | null;
  const me = {
    name: p?.full_name || "Admin",
    email: p?.email ?? user?.email ?? null,
  };

  const groups: AdminNavGroup[] = [
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
          count: newCases.count ?? 0,
        },
        { href: "/admin/payments", label: "Payments", icon: "payments", count: pendingPayments.count ?? 0 },
      ],
    },
    {
      label: "Tutors",
      items: [
        {
          href: "/admin/applicants",
          label: "Applications",
          icon: "applications",
          count: openApps.count ?? 0,
        },
        {
          href: "/admin/tutors",
          label: "Tutor approvals",
          icon: "tutors",
          count: pendingTutors.count ?? 0,
        },
      ],
    },
  ];

  return (
    <AdminShell groups={groups} user={me}>
      {children}
    </AdminShell>
  );
}
