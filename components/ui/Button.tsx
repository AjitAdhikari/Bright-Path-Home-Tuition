import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground shadow-glow hover:brightness-110",
  accent: "bg-accent text-accent-foreground hover:brightness-105",
  outline:
    "border-2 border-primary bg-transparent text-primary hover:bg-primary/10",
  ghost: "text-foreground hover:bg-muted",
};

/* 44–48px touch targets per the design's accessibility rules. */
const sizes: Record<Size, string> = {
  sm: "text-sm px-4 min-h-11",
  md: "text-[15px] px-5 min-h-12",
  lg: "text-[17px] px-7 min-h-13 rounded-xl",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: CommonProps & { href: string } & React.ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
