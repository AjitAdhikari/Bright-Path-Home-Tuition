import { DashboardShell, type NavItem } from "@/components/dashboard/Shell";

const nav: NavItem[] = [
  { href: "/tutor", label: "Status & leads", icon: "🏠" },
  { href: "/tutor/profile", label: "My profile", icon: "👤" },
  { href: "/tutor/documents", label: "Documents", icon: "📎" },
  { href: "/tutor/tuitions", label: "My tuitions", icon: "📚" },
  { href: "/tutor/earnings", label: "Earnings", icon: "💰" },
];

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell nav={nav} role="Tutor" title="Tutor dashboard" active="/tutor">
      {children}
    </DashboardShell>
  );
}
