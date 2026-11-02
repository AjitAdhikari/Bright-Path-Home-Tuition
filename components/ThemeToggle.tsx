"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/** Light/dark toggle. Renders a stable placeholder until mounted to avoid
 *  a hydration mismatch (the server doesn't know the resolved theme). */
export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  React.useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted",
        className
      )}
    >
      {mounted && isDark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{mounted && isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
