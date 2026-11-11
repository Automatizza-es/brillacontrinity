import { z } from "zod";

const configSchema = z.object({
  url: z
    .string()
    .url()
    .refine((value) => {
      const url = new URL(value);
      return (
        url.protocol === "https:" ||
        (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
      );
    }),
  publishableKey: z.string().startsWith("sb_publishable_").min(25),
});

/** Lazy validation: importing utilities must not require a configured project. */
export function parseSupabaseConfig(url: unknown, publishableKey: unknown) {
  const result = configSchema.safeParse({ url, publishableKey });
  if (!result.success) {
    // Never include input values (especially keys) in errors or logs.
    throw new Error(
      "Configura VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY con una clave publicable válida.",
    );
  }
  if (
    result.data.url.includes("YOUR_PROJECT_REF") ||
    result.data.publishableKey.includes("REPLACE_ME")
  ) {
    throw new Error("Sustituye los ejemplos de configuración de Supabase en .env.local.");
  }
  return result.data;
}
