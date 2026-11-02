import { DashboardShell, type NavItem } from "@/components/dashboard/Shell";

const nav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/requests", label: "Cases", icon: "📋" },
  { href: "/admin/tutors", label: "Tutor approvals", icon: "✅" },
  { href: "/admin/payments", label: "Payments", icon: "💸" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `active` is handled per-page via a wrapper; default to overview here.
  return (
    <DashboardShell nav={nav} role="Admin" title="Admin" active="/admin">
      {children}
    </DashboardShell>
  );
}
