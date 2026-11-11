/** Use the page origin, never the Supabase API origin (localhost may use a remote API).
 * Only HTTP loopback development may omit Secure; all other origins fail closed.
 */
export function sessionCookieOptions(pageUrl: URL) {
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(pageUrl.hostname);
  return {
    path: "/",
    sameSite: "lax" as const,
    secure: pageUrl.protocol === "https:" || !loopback,
  };
}
