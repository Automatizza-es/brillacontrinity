import { createServerOnlyFn } from "@tanstack/react-start";
import { createServerClient } from "@supabase/ssr";
import {
  getCookies,
  getRequestUrl,
  setCookie,
  setResponseHeader,
} from "@tanstack/react-start/server";
import { parseSupabaseConfig } from "./config";
import { sessionCookieOptions } from "./cookie-options";
import { SESSION_CACHE_HEADERS } from "./response-privacy";

function preventSessionCaching() {
  for (const [name, value] of Object.entries(SESSION_CACHE_HEADERS)) {
    setResponseHeader(name, value);
  }
}

/** Per-request client. Never cache a client carrying a user's cookies globally. */
export const getSupabaseServerClient = createServerOnlyFn(() => {
  const { url, publishableKey } = parseSupabaseConfig(
    process.env["VITE_SUPABASE_URL"],
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
  );
  // Any response using a session must stay out of shared/CDN caches.
  preventSessionCaching();
  const cookieOptions = sessionCookieOptions(getRequestUrl({ xForwardedHost: false }));
  return createServerClient(url, publishableKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookies, headers) {
        cookies.forEach(({ name, value, options }) =>
          setCookie(name, value, { ...options, ...cookieOptions }),
        );
        Object.entries(headers).forEach(([name, value]) => setResponseHeader(name, value));
        // Enforce privacy even if refresh headers or defaults change upstream.
        preventSessionCaching();
      },
    },
  });
});

/** Use inside future createServerFn handlers, before every privileged operation.
 * getUser verifies the session with Auth; getSession alone is not authorization.
 * The returned client still carries the user's identity and is subject to RLS.
 */
export const requirePoetryAdmin = createServerOnlyFn(async () => {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Acceso no autorizado.");
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) throw new Error("Acceso no autorizado.");
  return { supabase, user };
});
