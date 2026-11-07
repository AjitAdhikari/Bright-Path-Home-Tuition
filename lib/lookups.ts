import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Cached static lookups (areas). These tables are public-read and change very
 * rarely, yet were being fetched on every parent/tutor dashboard load. We read
 * them once and cache the result across requests.
 *
 * A plain anon client is used (not the request-scoped SSR client) so the cached
 * value is global and user-independent — safe because `areas` is RLS
 * public-read (`lookups_read_areas … using (true)`) and carries no private data.
 *
 * Invalidation: time-based (1 day). If an admin lookup-editing UI is added,
 * call `revalidateTag("lookups")` after a write to refresh immediately.
 */
function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export const getAreaMap = unstable_cache(
  async (): Promise<Map<number, string>> => {
    const supabase = anonClient();
    const { data } = await supabase.from("areas").select("id, name");
    return new Map(
      ((data ?? []) as { id: number; name: string }[]).map((a) => [a.id, a.name])
    );
  },
  ["lookup-areas"],
  { revalidate: 86_400, tags: ["lookups"] }
);

/**
 * Admin sidebar "waiting" badge counts. These ran on every admin navigation
 * (the counts live in the admin layout). They are admin-global aggregates with
 * no private content, so we cache them briefly with the service-role client.
 *
 * Short TTL (20s) keeps the badges responsive after admin actions without a
 * count query on every page view. The actual list pages are never cached, so
 * they always reflect the latest data immediately; only the sidebar number may
 * lag by up to the TTL. Admin write actions can `revalidateTag("admin-counts")`
 * for instant refresh if desired.
 */
const OPEN_APPLICATION_STATUSES = [
  "pending_review",
  "under_review",
  "changes_requested",
];

export const getAdminSidebarCounts = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const [newCases, openApps, pendingTutors, pendingPayments] =
      await Promise.all([
        admin.from("requests").select("id", { count: "exact", head: true }).eq("status", "new"),
        admin
          .from("tutor_applicants")
          .select("id", { count: "exact", head: true })
          .in("status", OPEN_APPLICATION_STATUSES),
        admin
          .from("tutor_profiles")
          .select("user_id", { count: "exact", head: true })
          .eq("verification_status", "pending"),
        admin.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
    return {
      newCases: newCases.count ?? 0,
      openApps: openApps.count ?? 0,
      pendingTutors: pendingTutors.count ?? 0,
      pendingPayments: pendingPayments.count ?? 0,
    };
  },
  ["admin-sidebar-counts"],
  { revalidate: 20, tags: ["admin-counts"] }
);
