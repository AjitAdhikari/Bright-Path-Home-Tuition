import { cn } from "@/lib/utils";
import type { CaseStatus } from "@/lib/constants";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground p-6 shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}

/* Small pill badges (brand / accent / tone). Radius 6, per style guide. */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "brand" | "accent" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    brand: "bg-primary/15 text-primary",
    accent: "bg-accent/20 text-accent-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning",
    danger: "bg-destructive/15 text-destructive",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-[13px] font-bold",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

/* Case-status badge — exact colours from the design's style guide. */
const STATUS_STYLE: Record<CaseStatus, string> = {
  new: "bg-warning/20 text-warning",
  verified: "bg-primary/15 text-primary",
  tutors_shared: "bg-primary/15 text-primary",
  demo_scheduled: "bg-secondary/15 text-secondary",
  demo_done: "bg-secondary/15 text-secondary",
  confirmed: "bg-success/15 text-success",
  active: "bg-success/15 text-success",
  replacement: "bg-warning/20 text-warning",
  closed: "bg-muted text-muted-foreground",
};

export function StatusBadge({
  status,
  label,
}: {
  status: CaseStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2.5 py-1 text-[13px] font-bold",
        STATUS_STYLE[status]
      )}
    >
      {label}
    </span>
  );
}
