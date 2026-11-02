import { DashboardShell, type NavItem } from "@/components/dashboard/Shell";

const nav: NavItem[] = [
  { href: "/parent", label: "My requests", icon: "📋" },
  { href: "/find-tutor", label: "New request", icon: "➕" },
];

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell nav={nav} role="Parent" title="My requests" active="/parent">
      {children}
    </DashboardShell>
  );
}
