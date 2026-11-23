import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestHandler } from "@tanstack/react-start/server";

const mocks = vi.hoisted(() => ({ createServerClient: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ createServerOnlyFn: (fn: unknown) => fn }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }));
import { protectSessionResponse } from "@/lib/supabase/response-privacy";
import { getSupabaseServerClient } from "@/lib/supabase/server";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("VITE_SUPABASE_URL", "https://synthetic.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_synthetic_test_value_only");
});
afterEach(() => vi.unstubAllEnvs());

function expectPrivate(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("CDN-Cache-Control")).toBe("no-store");
  expect(response.headers.get("Vercel-CDN-Cache-Control")).toBe("no-store");
  expect(response.headers.get("Pragma")).toBe("no-cache");
  expect(response.headers.get("Expires")).toBe("0");
}

describe("TanStack HTTP response integration (no Auth/network)", () => {
  it.each([
    ["https://preview.example/admin", true],
    ["https://brillacontrinity.vercel.app/admin", true],
    ["http://localhost:3000/admin", false],
    ["http://127.0.0.1:3000/admin", false],
    ["https://localhost:3000/admin", true],
    ["http://remote.example/admin", true],
  ])("sets cookie security and prevents caching for %s", async (url, secure) => {
    const handle = requestHandler(() => {
      getSupabaseServerClient();
      const options = mocks.createServerClient.mock.calls[0]![2];
      options.cookies.setAll(
        [
          { name: "test.0", value: "part-one", options: { secure: false, maxAge: 60 } },
          { name: "test.1", value: "", options: { maxAge: 0 } },
        ],
        { "Cache-Control": "public, max-age=3600" },
      );
      return new Response("private test content");
    });
    const response = await handle(new Request(url), {});
    expectPrivate(response);
    const cookies = response.headers.getSetCookie();
    expect(cookies).toHaveLength(2);
    for (const cookie of cookies) {
      expect(/; Secure(?:;|$)/i.test(cookie)).toBe(secure);
      expect(cookie).toContain("SameSite=Lax");
      expect(cookie).toContain("Path=/");
    }
    expect(cookies[1]).toContain("Max-Age=0");
  });

  it("uses the HTTPS proxy protocol without trusting forwarded host", async () => {
    const handle = requestHandler(() => {
      getSupabaseServerClient();
      expect(mocks.createServerClient.mock.calls[0]![2].cookieOptions.secure).toBe(true);
      return new Response("ok");
    });
    const response = await handle(
      new Request("http://internal:3000/admin", {
        headers: { "x-forwarded-proto": "https", "x-forwarded-host": "localhost" },
      }),
      {},
    );
    expectPrivate(response);
  });

  it("prevents caching without a token refresh, including denied responses", async () => {
    const handle = requestHandler(() => {
      getSupabaseServerClient();
      return new Response("unauthorized", { status: 401 });
    });
    const request = new Request("https://preview.example/admin");
    const response = protectSessionResponse(request, await handle(request, {}));
    expect(response.status).toBe(401);
    expectPrivate(response);
    expect(response.headers.getSetCookie()).toEqual([]);
  });
});

describe("final server privacy boundary", () => {
  it.each([200, 302, 401, 403, 500])("protects session responses with status %s", (status) => {
    const request = new Request("https://preview.example/poesia", {
      headers: { Cookie: "sb-test-auth-token.0=synthetic" },
    });
    const result = protectSessionResponse(
      request,
      new Response("body", {
        status,
        headers: { "Cache-Control": "public, s-maxage=3600", Location: "/admin" },
      }),
    );
    expect(result.status).toBe(status);
    expectPrivate(result);
    expect(result.headers.get("Location")).toBe("/admin");
  });
  it("protects refresh responses and preserves every Set-Cookie", () => {
    const headers = new Headers();
    headers.append("Set-Cookie", "sb-test-auth-token.0=one; Path=/; Secure");
    headers.append("Set-Cookie", "sb-test-auth-token.1=two; Path=/; Secure");
    const result = protectSessionResponse(
      new Request("https://preview.example/poesia"),
      new Response("ok", { headers }),
    );
    expectPrivate(result);
    expect(result.headers.getSetCookie()).toHaveLength(2);
  });
  it("protects authenticated API calls and future server functions", () => {
    for (const request of [
      new Request("https://preview.example/_serverFn/test"),
      new Request("https://preview.example/poesia", {
        headers: { Authorization: "Bearer synthetic" },
      }),
    ])
      expectPrivate(protectSessionResponse(request, new Response("ok")));
  });
  it("leaves other anonymous pages untouched", () => {
    const response = new Response("public", { headers: { "Cache-Control": "public, max-age=60" } });
    expect(protectSessionResponse(new Request("https://preview.example/sobre-mi"), response)).toBe(
      response,
    );
  });
});
