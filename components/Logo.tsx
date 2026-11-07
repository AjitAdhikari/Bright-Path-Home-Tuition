import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/constants";

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
      <span className="font-heading text-xl font-semibold tracking-tight text-foreground">
        Bright <b className="font-semibold italic text-primary">Path</b>
      </span>
    </Link>
  );
}
