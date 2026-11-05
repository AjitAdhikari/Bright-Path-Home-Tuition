import Link from "next/link";
import { cn } from "@/lib/utils";

export type Figure = {
  label: string;
  value: string | number;
  note?: string;
  href?: string;
};

/**
 * A row of key numbers in one bordered strip, divided by hairlines.
 * Shared by every dashboard — pass 2–4 items.
 */
export function Figures({ items }: { items: Figure[] }) {
  const cols = items.length >= 4 ? "lg:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : "";
  return (
    <div
      className={cn(
        "grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-card",
        cols
      )}
    >
      {items.map((item, i) => {
        const body = (
          <>
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 truncate text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {item.value}
            </p>
            {item.note && <p className="mt-1 truncate text-xs text-muted-foreground">{item.note}</p>}
          </>
        );
        const cell = cn(
          "block border-border p-5 sm:p-6",
          // 2-up below lg: right hairline on the left column, bottom hairline on
          // every row but the last; an odd last item spans the full row.
          i % 2 === 0 && i < items.length - 1 && "border-r",
          Math.floor(i / 2) < Math.floor((items.length - 1) / 2) && "border-b",
          items.length % 2 === 1 && i === items.length - 1 && "col-span-2 lg:col-span-1",
          // single row on large screens
          "lg:border-b-0",
          i < items.length - 1 ? "lg:border-r" : "lg:border-r-0",
          item.href && "transition-colors hover:bg-muted/40"
        );
        return item.href ? (
          <Link key={item.label} href={item.href} className={cell}>
            {body}
          </Link>
        ) : (
          <div key={item.label} className={cell}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
