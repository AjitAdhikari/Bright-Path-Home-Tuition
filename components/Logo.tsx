import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/constants";

/**
 * Bright Path logo: the "B" mark (sun rising over a winding path, cropped
 * from the original artwork in public/brand/bright-path-logo.png) with the
 * wordmark — "Bright" in navy, "Path" in sun amber, as in the original.
 *
 * The mark keeps its white background, so it reads on dark surfaces too.
 * "Path" is a <b>, not a <span>, so callers that recolour the last span
 * (e.g. the auth panel) only change "Bright".
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
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={36}
        height={36}
        priority
        className="h-9 w-9 shrink-0 rounded-lg"
      />
      <span className="font-heading text-xl font-bold tracking-tight text-[#0c1f3f] dark:text-foreground">
        Bright <b className="font-bold text-[#f9b233]">Path</b>
      </span>
    </Link>
  );
}
