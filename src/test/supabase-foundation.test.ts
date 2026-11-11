import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseSupabaseConfig } from "@/lib/supabase/config";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getCookies: vi.fn(),
  setCookie: vi.fn(),
  setResponseHeader: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ createServerOnlyFn: (fn: unknown) => fn }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }));
vi.mock("@tanstack/react-start/server", () => ({
  getCookies: mocks.getCookies,
  setCookie: mocks.setCookie,
  setResponseHeader: mocks.setResponseHeader,
}));
import { getSupabaseServerClient, requirePoetryAdmin } from "@/lib/supabase/server";

const testKey = "sb_publishable_synthetic_test_value_only";
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", testKey);
  mocks.getCookies.mockReturnValue({ "session.0": "part-one", "session.1": "part-two" });
});

describe("Supabase configuration", () => {
  it("accepts a public key with HTTPS or local HTTP", () => {
    expect(parseSupabaseConfig("https://test.supabase.co", testKey).publishableKey).toBe(testKey);
    expect(parseSupabaseConfig("http://127.0.0.1:54321", testKey).url).toContain("127.0.0.1");
  });
  it.each([undefined, "sb_secret_never_expose_this", "service_role", ""])(
    "rejects missing/privileged keys without echoing inputs: %s",
    (key) => {
      expect(() => parseSupabaseConfig("https://test.supabase.co", key)).toThrow(
        "clave publicable válida",
      );
      try {
        parseSupabaseConfig("https://test.supabase.co", key);
      } catch (error) {
        expect(String(error)).not.toContain("never_expose_this");
      }
    },
  );
  it("rejects plaintext remote connections and placeholder configuration", () => {
    expect(() => parseSupabaseConfig("http://remote.example", testKey)).toThrow();
    expect(() =>
      parseSupabaseConfig("https://YOUR_PROJECT_REF.supabase.co", "sb_publishable_REPLACE_ME_LONG"),
    ).toThrow("ejemplos");
  });
});

describe("per-request SSR adapter", () => {
  it("creates separate clients, forwards all cookie chunks and cache headers", () => {
    getSupabaseServerClient();
    getSupabaseServerClient();
    expect(mocks.createServerClient).toHaveBeenCalledTimes(2);
    expect(mocks.setResponseHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
    const options = mocks.createServerClient.mock.calls[0]![2];
    expect(options.cookies.getAll()).toEqual([
      { name: "session.0", value: "part-one" },
      { name: "session.1", value: "part-two" },
    ]);
    options.cookies.setAll(
      [
        { name: "session.0", value: "new", options: { path: "/", sameSite: "lax" } },
        { name: "session.1", value: "", options: { maxAge: 0 } },
      ],
      { "Cache-Control": "private, no-store", Pragma: "no-cache", Expires: "0" },
    );
    expect(mocks.setCookie).toHaveBeenCalledTimes(2);
    expect(mocks.setCookie).toHaveBeenCalledWith("session.1", "", { maxAge: 0 });
    expect(mocks.setResponseHeader).toHaveBeenCalledWith("Pragma", "no-cache");
    expect(mocks.setResponseHeader).toHaveBeenCalledWith("Expires", "0");
  });
});

describe("server authorization guard", () => {
  function client(user: { id: string } | null, membership: unknown, dbError: unknown = null) {
    const maybeSingle = vi.fn().mockResolvedValue({ data: membership, error: dbError });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const from = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
      from,
    };
    mocks.createServerClient.mockReturnValue(supabase);
    return { supabase, eq };
  }
  it("rejects visitors before querying membership", async () => {
    const { supabase } = client(null, null);
    await expect(requirePoetryAdmin()).rejects.toThrow("Acceso no autorizado");
    expect(supabase.from).not.toHaveBeenCalled();
  });
  it("rejects authenticated users without membership", async () => {
    client({ id: "ordinary-user" }, null);
    await expect(requirePoetryAdmin()).rejects.toThrow("Acceso no autorizado");
  });
  it("fails closed when authorization cannot be checked", async () => {
    client({ id: "admin" }, null, { message: "offline" });
    await expect(requirePoetryAdmin()).rejects.toThrow("Acceso no autorizado");
  });
  it("returns the same RLS-bound client only for verified admins", async () => {
    const { supabase, eq } = client({ id: "admin" }, { user_id: "admin" });
    expect((await requirePoetryAdmin()).supabase).toBe(supabase);
    expect(supabase.auth.getUser).toHaveBeenCalledOnce();
    expect(eq).toHaveBeenCalledWith("user_id", "admin");
  });
});
