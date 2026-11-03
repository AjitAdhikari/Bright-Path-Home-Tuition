import { cn } from "@/lib/utils";

/** A column definition for {@link DataTable}. */
export type Column<T> = {
  key: string;
  header: string;
  /** Extra classes for both the header cell and the body cells in this column. */
  className?: string;
  cell: (row: T) => React.ReactNode;
};

/**
 * Card shell around a table (or any table-like content): a rounded, bordered
 * surface with an optional title bar and horizontal scroll on small screens.
 */
export function TableCard({
  title,
  subtitle,
  action,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            {title && (
              <h2 className="font-heading text-base font-bold text-foreground">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/** A clean, consistent data table with a muted header and hover rows. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty = "Nothing here yet.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  empty?: React.ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="px-5 py-16 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }
  return (
    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          {columns.map((c) => (
            <th
              key={c.key}
              className={cn("px-5 py-3 font-semibold", c.className)}
            >
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((row, i) => (
          <tr
            key={rowKey(row, i)}
            className="transition-colors hover:bg-muted/40"
          >
            {columns.map((c) => (
              <td
                key={c.key}
                className={cn("px-5 py-3.5 align-middle", c.className)}
              >
                {c.cell(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
