/// <reference types="vite/client" />
import { createBrowserClient } from "@supabase/ssr";
import { parseSupabaseConfig } from "./config";
import { sessionCookieOptions } from "./cookie-options";

/** Only call in browser UI; no client is instantiated at module import. */
export function getSupabaseBrowserClient() {
  const { url, publishableKey } = parseSupabaseConfig(
    import.meta.env["VITE_SUPABASE_URL"],
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
  );
  return createBrowserClient(url, publishableKey, {
    cookieOptions: sessionCookieOptions(new URL(window.location.href)),
  });
}
