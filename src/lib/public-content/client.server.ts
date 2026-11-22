import { createClient } from "@supabase/supabase-js";
import { parseSupabaseConfig } from "@/lib/supabase/config";

/** Intentionally anonymous, even if the visitor has an administrator's cookies. */
export function createPublicContentClient() {
  const { url, publishableKey } = parseSupabaseConfig(
    process.env["VITE_SUPABASE_URL"],
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
  );
  return createClient(url, publishableKey, {
    db: { retry: false },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(8000) }),
    },
  });
}
