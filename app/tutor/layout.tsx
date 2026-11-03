import { DashboardShell, type NavItem } from "@/components/dashboard/Shell";

const nav: NavItem[] = [
  { href: "/tutor", label: "Status & leads", icon: "home" },
  { href: "/tutor/profile", label: "My profile", icon: "profile" },
  { href: "/tutor/documents", label: "Documents", icon: "documents" },
  { href: "/tutor/tuitions", label: "My tuitions", icon: "tuitions" },
  { href: "/tutor/earnings", label: "Earnings", icon: "earnings" },
];

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      nav={nav}
      role="Tutor"
      title="Tutor dashboard"
      subtitle="Your status, leads and earnings"
    >
      {children}
    </DashboardShell>
  );
}
