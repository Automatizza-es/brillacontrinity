export const SESSION_CACHE_HEADERS = {
  "Cache-Control": "private, no-store",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  Pragma: "no-cache",
  Expires: "0",
} as const;

/** Preview indexing guard, separate from session caching and unchanged in Production. */
export function protectPreviewIndexing(response: Response, environment: string | undefined) {
  if (environment !== "preview") return response;
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Final response boundary: framework error/redirect handling can discard event headers. */
export function protectSessionResponse(request: Request, response: Response): Response {
  response = protectPreviewIndexing(response, process.env["VERCEL_ENV"]);
  const path = new URL(request.url).pathname;
  const livePublicContent =
    path === "/" ||
    path === "/poesia" ||
    path.startsWith("/poesia/") ||
    path === "/publicaciones" ||
    path === "/publicaciones/";
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
    !livePublicContent &&
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
