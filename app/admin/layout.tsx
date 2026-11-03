import { DashboardShell, type NavItem } from "@/components/dashboard/Shell";

const nav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/requests", label: "Cases", icon: "cases" },
  { href: "/admin/applicants", label: "Applications", icon: "requests" },
  { href: "/admin/tutors", label: "Tutor approvals", icon: "tutors" },
  { href: "/admin/payments", label: "Payments", icon: "payments" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      nav={nav}
      role="Admin"
      title="Admin"
      subtitle="Cases, tutors and payments at a glance"
    >
      {children}
    </DashboardShell>
  );
}
