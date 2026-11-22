import { afterEach, describe, expect, it, vi } from "vitest";
import { protectPreviewIndexing, protectSessionResponse } from "@/lib/supabase/response-privacy";
import { sessionCookieOptions } from "@/lib/supabase/cookie-options";

afterEach(() => vi.unstubAllEnvs());
describe("Preview deployment boundaries", () => {
  it.each([200, 302, 404, 500, 503])(
    "sets Preview noindex for status %s without changing content/status/cookies",
    async (status) => {
      const response = new Response("synthetic content", {
        status,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": "synthetic=value; Secure; SameSite=Lax",
          Location: "/admin",
        },
      });
      const result = protectPreviewIndexing(response, "preview");
      expect(result.status).toBe(status);
      expect(await result.text()).toBe("synthetic content");
      expect(result.headers.get("X-Robots-Tag")).toBe("noindex, nofollow, noarchive");
      expect(result.headers.get("Set-Cookie")).toBe("synthetic=value; Secure; SameSite=Lax");
      expect(result.headers.get("Location")).toBe("/admin");
    },
  );
  it.each([undefined, "production", "development"])(
    "does not add Preview restrictions in %s",
    (environment) => {
      const response = new Response("test");
      expect(protectPreviewIndexing(response, environment)).toBe(response);
      expect(response.headers.has("X-Robots-Tag")).toBe(false);
    },
  );
  it("enforces noindex at the final server boundary on every Preview path", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    for (const path of [
      "/",
      "/poesia",
      "/publicaciones",
      "/admin",
      "/contacto",
      "/unknown",
      "/_serverFn/test",
    ]) {
      const response = protectSessionResponse(
        new Request("https://trinity-git-prep.example.vercel.app" + path),
        new Response("test", { status: 404 }),
      );
      expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
    }
  });
  it("uses host-only cookie settings and Secure on Preview HTTPS, preserving local HTTP", () => {
    expect(
      sessionCookieOptions(new URL("https://trinity-git-prep.example.vercel.app/admin")),
    ).toEqual({ path: "/", sameSite: "lax", secure: true });
    expect(sessionCookieOptions(new URL("http://127.0.0.1:8080/admin")).secure).toBe(false);
    expect(
      sessionCookieOptions(new URL("https://trinity-git-prep.example.vercel.app/admin")),
    ).not.toHaveProperty("domain");
  });
});
