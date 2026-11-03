import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refreshes the Supabase session on every request and guards the three
 * role-scoped areas. Fine-grained row access is still enforced by RLS in
 * Postgres — this is only the coarse "are you allowed in this door" check.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const guarded = ["/tutor", "/parent", "/admin"];
  const needsAuth = guarded.some((p) => pathname.startsWith(p));

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Coarse role gate — keep each role in its own area. The real row-level
  // guard is RLS in Postgres (is_admin() reads the profiles table), so this
  // only needs the role from the user's metadata.
  if (needsAuth && user) {
    const role = (user.app_metadata?.role ?? user.user_metadata?.role) as
      | string
      | undefined;
    const area = pathname.split("/")[1]; // tutor | parent | admin
    if (role && role !== area && !(area === "parent" && role === "admin")) {
      const url = request.nextUrl.clone();
      url.pathname = `/${role}`;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
