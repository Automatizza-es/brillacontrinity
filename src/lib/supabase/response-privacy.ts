export const SESSION_CACHE_HEADERS = {
  "Cache-Control": "private, no-store",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  Pragma: "no-cache",
  Expires: "0",
} as const;

/** Final response boundary: framework error/redirect handling can discard event headers. */
export function protectSessionResponse(request: Request, response: Response): Response {
  const path = new URL(request.url).pathname;
  const privateRoute =
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path === "/_serverFn" ||
    path.startsWith("/_serverFn/");
  const hasSession = /(?:^|;\s*)sb-[^=;]+-auth-token[^=;]*=/.test(
    request.headers.get("cookie") ?? "",
  );
  const setsCookie = response.headers.has("Set-Cookie");
  const alreadyPrivate = response.headers.get("Cache-Control")?.includes("no-store");
  if (
    !privateRoute &&
    !hasSession &&
    !request.headers.has("Authorization") &&
    !setsCookie &&
    !alreadyPrivate
  ) {
    return response;
  }
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SESSION_CACHE_HEADERS)) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
