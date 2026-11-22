import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminService } from "@/lib/admin/service.server";
import { emptyPoem, poemSchema, poemToInput, validate, loginSchema } from "@/lib/admin/poems";

const uuid = "10000000-0000-4000-8000-000000000001";
const stored = {
  ...emptyPoem(),
  id: uuid,
  title: "Prueba local",
  slug: "prueba-local",
  body: "  Verso de prueba\n\nOtra estrofa\n",
  description: null,
  written_on: null,
  written_on_original: null,
  first_published_at: null,
  published_at: null,
  updated_at: "2026-11-22T10:00:00.123456+00:00",
};
function harness(
  options: {
    user?: boolean;
    admin?: boolean;
    authError?: unknown;
    membershipError?: unknown;
    loginError?: unknown;
    logoutError?: unknown;
    dbError?: unknown;
    data?: unknown;
  } = {},
) {
  const response = {
    data: options.data === undefined ? stored : options.data,
    count: 1,
    error: options.dbError ?? null,
  };
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const name of ["select", "eq", "order", "range", "insert", "update"])
    query[name] = vi.fn().mockImplementation(() => query);
  query["maybeSingle"] = vi.fn().mockResolvedValue(response);
  query["single"] = vi.fn().mockResolvedValue(response);
  query["then"] = vi.fn().mockImplementation((resolve) => Promise.resolve(response).then(resolve));
  const membership = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: options.admin === false ? null : { user_id: uuid },
      error: options.membershipError ?? null,
    }),
  };
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options.user === false ? null : { id: uuid } },
        error: options.authError ?? null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: options.loginError ?? null }),
      signOut: vi.fn().mockResolvedValue({ error: options.logoutError ?? null }),
    },
    from: vi.fn().mockImplementation((table) => (table === "admin_users" ? membership : query)),
  };
  const factory = vi.fn().mockReturnValue(client);
  return {
    client,
    query,
    membership,
    factory,
    service: createAdminService(factory as () => SupabaseClient),
  };
}
describe("Admin server service", () => {
  it("returns the login view without reading membership or poems for visitors", async () => {
    const h = harness({ user: false });
    expect(await h.service.workspace(0, "all")).toEqual({ mode: "login" });
    expect(h.client.from).not.toHaveBeenCalled();
  });
  it("denies non-administrators and does not fetch poems", async () => {
    const h = harness({ admin: false });
    expect(await h.service.workspace(0, "all")).toEqual({ mode: "denied" });
    expect(h.client.from).toHaveBeenCalledTimes(1);
    expect(h.client.from).toHaveBeenCalledWith("admin_users");
  });
  it("fails closed if membership or Auth cannot be verified", async () => {
    for (const options of [
      { membershipError: { message: "sensitive failure" } },
      { authError: { name: "AuthRetryableFetchError" } },
    ]) {
      const h = harness(options);
      expect(await h.service.workspace(0, "all")).toEqual({ mode: "error" });
      expect(h.query["select"]).not.toHaveBeenCalled();
    }
  });
  it("lists summaries with pagination and the verified user's identity", async () => {
    const h = harness({ data: [stored] });
    const result = await h.service.workspace(2, "draft");
    expect(result.mode).toBe("ready");
    expect(h.query["range"]).toHaveBeenCalledWith(40, 59);
    expect(h.query["eq"]).toHaveBeenCalledWith("status", "draft");
    expect(h.membership.eq).toHaveBeenCalledWith("user_id", uuid);
    expect(h.client.auth.getUser).toHaveBeenCalledOnce();
  });
  it.each(["poem", "save"] as const)(
    "rechecks authorization on %s, before accessing poems",
    async (operation) => {
      const h = harness({ admin: false });
      const result =
        operation === "save"
          ? await h.service.save(poemToInput(stored))
          : await h.service.poem(uuid);
      expect(result.ok).toBe(false);
      expect(h.client.auth.getUser).toHaveBeenCalledOnce();
      expect(h.query["insert"]).not.toHaveBeenCalled();
      expect(h.query["update"]).not.toHaveBeenCalled();
      expect(h.query["select"]).not.toHaveBeenCalled();
    },
  );
  it("sends login credentials only to Auth and returns no tokens/user details", async () => {
    const h = harness();
    const result = await h.service.login("synthetic@example.invalid", "synthetic-not-real");
    expect(h.client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "synthetic@example.invalid",
      password: "synthetic-not-real",
    });
    expect(result).toEqual({ ok: true, data: null });
    expect(JSON.stringify(result)).not.toContain("synthetic");
  });
  it("removes the local session when a signed-in user lacks membership", async () => {
    const h = harness({ admin: false });
    expect((await h.service.login("synthetic@example.invalid", "synthetic-not-real")).ok).toBe(
      false,
    );
    expect(h.client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
  it("does not expose Auth errors or authenticate after a rejected password", async () => {
    const h = harness({ loginError: { message: "synthetic secret" } });
    const result = await h.service.login("synthetic@example.invalid", "synthetic-not-real");
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("synthetic");
    expect(h.client.auth.getUser).not.toHaveBeenCalled();
  });
  it("signs out only the requesting session and reports failures", async () => {
    const h = harness();
    expect(await h.service.logout()).toEqual({ ok: true, data: null });
    expect(h.client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect((await harness({ logoutError: { message: "private" } }).service.logout()).ok).toBe(
      false,
    );
  });
  it("preserves spaces, line breaks and stanzas and never accepts owner/metadata fields", async () => {
    const h = harness();
    const input = { ...poemToInput(stored), id: null, expectedUpdatedAt: null };
    expect((await h.service.save(input)).ok).toBe(true);
    const payload = h.query["insert"]!.mock.calls[0]![0];
    expect(payload.body).toBe(stored.body);
    expect(payload).not.toHaveProperty("first_published_at");
    expect(payload).not.toHaveProperty("user_id");
  });
  it("updates under an optimistic concurrency condition", async () => {
    const h = harness();
    await h.service.save(poemToInput(stored));
    expect(h.query["eq"]).toHaveBeenCalledWith("id", uuid);
    expect(h.query["eq"]).toHaveBeenCalledWith("updated_at", stored.updated_at);
    const stale = await harness({ data: null }).service.save(poemToInput(stored));
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error).toContain("otra pestaña");
  });
  it.each(["23505", "23514", "42501", "500"])("sanitizes database error %s", async (code) => {
    const h = harness({ dbError: { code, message: "synthetic confidential details" } });
    const result = await h.service.save(poemToInput(stored));
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("confidential");
  });
});
describe("Editor input validation", () => {
  it("allows empty draft bodies, but requires actual text to publish", () => {
    const input = { ...emptyPoem(), title: "Prueba", slug: "prueba", body: " \n\n" };
    expect(poemSchema.safeParse(input).success).toBe(true);
    expect(poemSchema.safeParse({ ...input, status: "published" }).success).toBe(false);
  });
  it("does not trim the poem and rejects forged metadata and invalid concurrency", () => {
    const input = { ...poemToInput(stored), first_published_at: "forged" };
    const parsed = poemSchema.parse(input);
    expect(parsed.body).toBe(stored.body);
    expect(parsed).not.toHaveProperty("first_published_at");
    expect(poemSchema.safeParse({ ...input, expectedUpdatedAt: null }).success).toBe(false);
  });
  it("never serializes submitted passwords in validation errors", () => {
    expect(() =>
      validate(loginSchema, { email: "invalid", password: "sensitive-synthetic-value" }),
    ).toThrow("Solicitud no válida");
    try {
      validate(loginSchema, { email: "invalid", password: "sensitive-synthetic-value" });
    } catch (error) {
      expect(String(error)).not.toContain("sensitive");
    }
  });
});

it("rejects impossible dates without altering valid leap dates or empty dates", () => {
  const input = { ...emptyPoem(), title: "Prueba", slug: "prueba" };
  expect(poemSchema.safeParse({ ...input, writtenOn: "2024-02-29" }).success).toBe(true);
  expect(poemSchema.safeParse({ ...input, writtenOn: "2026-02-30" }).success).toBe(false);
  expect(poemSchema.safeParse(input).success).toBe(true);
});
