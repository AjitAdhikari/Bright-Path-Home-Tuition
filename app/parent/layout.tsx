import { DashboardShell, type NavItem } from "@/components/dashboard/Shell";

const nav: NavItem[] = [
  { href: "/parent", label: "My requests", icon: "requests" },
  { href: "/find-tutor", label: "New request", icon: "add" },
];

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      nav={nav}
      role="Parent"
      title="My requests"
      subtitle="Track your tutor requests and matches"
    >
      {children}
    </DashboardShell>
  );
}
