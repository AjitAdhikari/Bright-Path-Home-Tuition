import { DashboardShell, type NavGroup } from "@/components/dashboard/Shell";

const groups: NavGroup[] = [
  {
    label: "Tuition",
    items: [
      { href: "/parent", label: "Overview", icon: "home" },
      { href: "/find-tutor", label: "New request", icon: "add" },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/parent/profile", label: "Profile", icon: "profile" }],
  },
];

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell groups={groups} role="Parent" title="Parent" profileHref="/parent/profile">
      {children}
    </DashboardShell>
  );
}
