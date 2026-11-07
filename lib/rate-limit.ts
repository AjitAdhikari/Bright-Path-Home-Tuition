import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort in-memory rate limiter for public endpoints (application form,
 * tutor matching, status lookup, payment initiation). It throttles bursts from
 * a single client within one server process.
 *
 * Limitation: state is per-instance and in-memory, so it does not coordinate
 * across a horizontally-scaled / serverless deployment. For hard guarantees in
 * production, back this with a shared store (e.g. Upstash Redis). It is still a
 * meaningful first line against casual spam and accidental retry storms.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Occasionally evict expired buckets so the map can't grow unbounded.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (existing.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }
  existing.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/** Best-effort client IP from proxy headers (falls back to a shared bucket). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "unknown";
}

/** Convenience: throttle the current request by IP under a named scope. */
export async function limitByIp(
  scope: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const ip = await clientIp();
  return rateLimit(`${scope}:${ip}`, limit, windowMs);
}
