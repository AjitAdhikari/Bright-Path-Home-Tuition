import { Check } from "lucide-react";
import type { CaseStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { STEPS, stepOf } from "./data";

/**
 * Where a request is on its way from "received" to "classes started".
 * `compact` is a thin segmented bar for lists; the full version labels
 * every step.
 */
export function RequestSteps({ status, compact }: { status: CaseStatus; compact?: boolean }) {
  const closed = status === "closed";
  const current = stepOf(status);
  const allDone = status === "active" || status === "confirmed";

  if (compact) {
    return (
      <div className="flex gap-1" aria-label={`Step ${current + 1} of ${STEPS.length}: ${STEPS[current]}`}>
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full",
              closed
                ? "bg-muted"
                : i < current || (allDone && i === current)
                  ? "bg-foreground/85" // navy in light, pale in dark — so amber only ever means "now"
                  : i === current
                    ? "bg-accent"
                    : "bg-muted"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <ol className="grid grid-cols-5 gap-2">
      {STEPS.map((label, i) => {
        const done = !closed && (i < current || (allDone && i === current));
        const now = !closed && !done && i === current;
        return (
          <li key={label} className="relative">
            {i > 0 && (
              <span
                aria-hidden
                className={cn("absolute top-3 h-px", done || now ? "bg-primary" : "bg-border")}
                // From the previous circle's edge to this one's (gap-2 = 8px, circle r = 12px).
                style={{ left: "calc(-50% + 6px)", right: "calc(50% + 14px)" }}
              />
            )}
            <div className="relative flex flex-col items-center text-center">
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold",
                  done && "bg-primary text-primary-foreground",
                  now && "border-2 border-accent bg-card text-foreground",
                  !done && !now && "border border-border bg-card text-muted-foreground"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  "mt-2 text-[11px] leading-snug sm:text-xs",
                  done || now ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
