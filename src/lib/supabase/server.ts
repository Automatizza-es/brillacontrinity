import { createServerOnlyFn } from "@tanstack/react-start";
import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie, setResponseHeader } from "@tanstack/react-start/server";
import { parseSupabaseConfig } from "./config";

/** Per-request client. Never cache a client carrying a user's cookies globally. */
export const getSupabaseServerClient = createServerOnlyFn(() => {
  const { url, publishableKey } = parseSupabaseConfig(
    process.env["VITE_SUPABASE_URL"],
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
  );
  // Any response using a session must stay out of shared/CDN caches.
  setResponseHeader("Cache-Control", "private, no-store");
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookies, headers) {
        cookies.forEach(({ name, value, options }) => setCookie(name, value, options));
        Object.entries(headers).forEach(([name, value]) => setResponseHeader(name, value));
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
