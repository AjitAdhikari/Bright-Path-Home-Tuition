import { DashboardShell, type NavGroup } from "@/components/dashboard/Shell";

const groups: NavGroup[] = [
  {
    label: "Teaching",
    items: [
      { href: "/tutor", label: "Overview", icon: "home" },
      { href: "/tutor/tuitions", label: "My students", icon: "tuitions" },
      { href: "/tutor/earnings", label: "Earnings", icon: "earnings" },
    ],
  },
  {
    label: "Your profile",
    items: [
      { href: "/tutor/profile", label: "Profile", icon: "profile" },
      { href: "/tutor/documents", label: "Documents", icon: "documents" },
    ],
  },
];

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell groups={groups} role="Tutor" title="Tutor" profileHref="/tutor/profile">
      {children}
    </DashboardShell>
  );
}
