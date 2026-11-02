import Link from "next/link";
import { SITE } from "@/lib/constants";

/**
 * Bright Path mark — a house (home tuition) with a marigold spark at its
 * heart: the bright path a child takes at home. Teal rounded square.
 */
export function Logo({
  className = "",
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label={`${SITE.name} home`}
    >
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <defs>
          <linearGradient id="bp-logo" x1="0" y1="0" x2="36" y2="36">
            <stop offset="0%" stopColor="#862721" />
            <stop offset="100%" stopColor="#651911" />
          </linearGradient>
        </defs>
        <rect width="36" height="36" rx="10" fill="url(#bp-logo)" />
        <path
          d="M8 17 L18 9 L28 17"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11 16 V27 H25 V16"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <circle cx="18" cy="21" r="2.6" fill="#937636" />
      </svg>
      <span className="font-heading text-xl font-bold tracking-tight text-foreground">
        {SITE.name}
      </span>
    </Link>
  );
}
