import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPrototypeMode } from "./mock-client";

/** Routes accessible without authentication (auth pages + OAuth callback). */
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/auth/callback"];

/** Routes that authenticated users should be redirected away from (subset of PUBLIC_ROUTES). */
const AUTH_ONLY_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  // PROTOTYPE_MODE: demo user is always "logged in". Skip Supabase entirely.
  if (isPrototypeMode()) {
    if (AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
      return redirectTo(request, "/dashboard");
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Unauthenticated user on protected route -> login
  if (!user && !PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return redirectTo(request, "/login");
  }

  // Authenticated user on auth-only route -> dashboard
  if (user && AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    return redirectTo(request, "/dashboard");
  }

  return supabaseResponse;
}
