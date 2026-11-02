import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * Server Supabase client for Server Components, Server Actions and route
 * handlers. Reads the session from cookies. Always verify the user with
 * `supabase.auth.getUser()` — never trust the cookie payload alone.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore; middleware
            // refreshes the session cookie on the way through.
          }
        },
      },
    }
  );
}

/**
 * Service-role client. SERVER ONLY. Bypasses RLS — use sparingly, e.g. in
 * payment callbacks where we must write regardless of the caller's session.
 */
export function createAdminClient() {
  const { createClient: createRawClient } = require("@supabase/supabase-js");
  return createRawClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
