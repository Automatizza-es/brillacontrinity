import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { poems } from "@/content/poems";
import { publications } from "@/content/publications";
import { createPublicContentService, PUBLIC_CONTENT_ERROR } from "@/lib/public-content/service";
import { createPublicContentClient } from "@/lib/public-content/client.server";
import { freshPublicContent, validPoemSlug } from "@/lib/public-content/route-options";
import { protectSessionResponse } from "@/lib/supabase/response-privacy";
const key = "sb_publishable_synthetic_public_test_only";
const book = publications[0]!;
const baseBook = {
  id: "book-1",
  slug: book.slug,
  title: book.title,
  publisher: book.publisher,
  place: book.place!,
  year: book.year,
  kind: book.kind,
  role: book.role!,
  synopsis: null,
  cover_url: book.coverUrl!,
  isbn: null,
  purchase_links: [],
};
let clientSequence = 0;
function harness() {
  const rows = poems.map((p, i) => ({
    id: `poem-${i}`,
    slug: p.slug,
    title: p.title,
    body: p.text!,
    description: null,
    written_on: i === 0 ? "2023-05-07" : null,
    written_on_original: p.writtenOn ?? null,
    publication_id: p.publication ? baseBook.id : null,
    sort_order: i,
    status: "published",
  }));
  rows.push({
    ...rows[0]!,
    id: "private",
    slug: "borrador-local",
    title: "Borrador local",
    body: "Texto privado de prueba",
    status: "draft",
  });
  const state = {
    rows,
    books: [{ ...baseBook }],
    fail: false,
    malformed: false,
    ignoreFilter: false,
  };
  const requests: { url: URL; options?: RequestInit }[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    requests.push({ url, ...(options ? { options } : {}) });
    if (state.fail)
      return Response.json({ message: "synthetic confidential provider error" }, { status: 503 });
    if (state.malformed) return Response.json(null);
    let data: unknown[];
    if (url.pathname.endsWith("/poems")) {
      expect(url.searchParams.get("status")).toBe("eq.published");
      expect(url.searchParams.get("order") ?? "sort_order.asc,id.asc").toContain("sort_order.asc");
      data = state.rows
        .filter(
          (p) =>
            (state.ignoreFilter || p.status === "published") &&
            (!url.searchParams.has("slug") || "eq." + p.slug === url.searchParams.get("slug")),
        )
        .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
    } else {
      expect(url.pathname.endsWith("/publications")).toBe(true);
      data = state.books.filter(
        (b) => !url.searchParams.has("id") || "eq." + b.id === url.searchParams.get("id"),
      );
    }
    const offset = Number(url.searchParams.get("offset") ?? 0),
      limit = Number(url.searchParams.get("limit") ?? 1000);
    data = data.slice(offset, offset + limit);
    const headers = new Headers(options?.headers);
    return Response.json(headers.get("accept")?.includes("vnd.pgrst.object") ? data[0] : data);
  });
  const client = createClient("https://synthetic.supabase.co", key, {
    db: { retry: false },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: `synthetic-public-${++clientSequence}`,
    },
    global: { fetch: fetchMock },
  });
  return { state, requests, fetchMock, service: createPublicContentService(() => client) };
}
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
describe("Anonymous published content service", () => {
  it("lists only published poems in source order and preserves anthology metadata/links", async () => {
    const h = harness(),
      data = await h.service.catalog();
    expect(data.poems.map((p) => p.slug)).toEqual(poems.map((p) => p.slug));
    expect(data.publications[0]).toEqual({ ...book, purchaseLinks: [] });
    expect(data.poems[0]?.writtenOn).toBe(poems[0]?.writtenOn);
    expect(JSON.stringify(data)).not.toContain("Texto privado");
    expect(data.poems.every((p) => !("text" in p))).toBe(true);
  });
  it.each(poems.map((p) => [p.slug, p] as const))(
    "returns exact original text and metadata for %s",
    async (slug, source) => {
      const result = await harness().service.poem(slug);
      expect(result?.poem).toEqual(source);
      expect(result?.publication?.slug ?? null).toBe(source.publication ?? null);
    },
  );
  it("returns not-found for an unpublished poem, never the static original", async () => {
    const h = harness();
    h.state.rows[0]!.status = "draft";
    expect(await h.service.poem(poems[0]!.slug)).toBeNull();
    expect(await h.service.poem("borrador-local")).toBeNull();
    expect((await h.service.catalog()).poems).toHaveLength(5);
  });
  it("observes publishing, withdrawal and republishing on subsequent requests, without a rebuild", async () => {
    const h = harness();
    expect(await h.service.poem("borrador-local")).toBeNull();
    h.state.rows.at(-1)!.status = "published";
    expect((await h.service.catalog()).poems).toHaveLength(7);
    expect((await h.service.poem("borrador-local"))?.poem.text).toBe("Texto privado de prueba");
    h.state.rows.at(-1)!.status = "draft";
    expect(await h.service.poem("borrador-local")).toBeNull();
    expect((await h.service.catalog()).poems).toHaveLength(6);
  });
  it("removes a withdrawn poem from anthology links immediately", async () => {
    const h = harness();
    expect((await h.service.catalog()).publications[0]?.poemSlugs).toHaveLength(4);
    h.state.rows.find((p) => p.slug === "yo-soy-agua")!.status = "draft";
    expect((await h.service.catalog()).publications[0]?.poemSlugs).toEqual([
      "circulo-de-mujeres",
      "me-pierdo",
      "desaprendiendo",
    ]);
  });
  it("allows any new valid slug without adding a source entry or route file", async () => {
    const h = harness();
    h.state.rows.push({
      ...h.state.rows[0]!,
      id: "new",
      slug: "nuevo-poema-publicado",
      sort_order: 10,
    });
    expect((await h.service.poem("nuevo-poema-publicado"))?.poem.slug).toBe(
      "nuevo-poema-publicado",
    );
  });
  it("does not return old results, empty success or 404 on provider/network errors", async () => {
    const h = harness();
    expect(await h.service.poem("atrevete-a-brillar")).not.toBeNull();
    h.state.fail = true;
    await expect(h.service.poem("atrevete-a-brillar")).rejects.toThrow(PUBLIC_CONTENT_ERROR);
    await expect(h.service.catalog()).rejects.toThrow(PUBLIC_CONTENT_ERROR);
    h.state.fail = false;
    h.state.malformed = true;
    await expect(h.service.catalog()).rejects.toThrow(PUBLIC_CONTENT_ERROR);
    h.state.malformed = false;
    h.fetchMock.mockRejectedValue(new Error("synthetic confidential URL/key"));
    await expect(h.service.catalog()).rejects.toThrow(PUBLIC_CONTENT_ERROR);
  });
  it("fails closed if a malformed response includes a draft or loses a publication relation", async () => {
    const h = harness();
    h.state.ignoreFilter = true;
    await expect(h.service.catalog()).rejects.toThrow(PUBLIC_CONTENT_ERROR);
    h.state.ignoreFilter = false;
    h.state.books = [];
    await expect(h.service.poem("yo-soy-agua")).rejects.toThrow(PUBLIC_CONTENT_ERROR);
  });
  it("distinguishes a genuine empty catalog from a failed query", async () => {
    const h = harness();
    h.state.rows = [];
    h.state.books = [];
    expect(await h.service.catalog()).toEqual({ poems: [], publications: [] });
  });
  it("paginates beyond the Data API page limit", async () => {
    const h = harness();
    h.state.rows = Array.from({ length: 201 }, (_, i) => ({
      ...h.state.rows[0]!,
      id: `p-${i}`,
      slug: `poema-${i}`,
      sort_order: i,
    }));
    expect((await h.service.catalog()).poems).toHaveLength(201);
    expect(h.requests.filter((r) => r.url.pathname.endsWith("/poems"))).toHaveLength(2);
  });
  it("rejects invalid slugs without sending a database request", async () => {
    const h = harness();
    for (const slug of ["../admin", "texto con espacios", "A".repeat(161)])
      expect(await h.service.poem(slug)).toBeNull();
    expect(h.requests).toHaveLength(0);
    expect(validPoemSlug("nuevo-poema")).toBe(true);
  });
});
describe("Public freshness and client isolation", () => {
  it("uses a fresh anonymous client without storage or visitor cookies and bypasses upstream caches", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://synthetic.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", key);
    const fake = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json([]));
    const client = createPublicContentClient();
    await client.from("poems").select("slug").eq("status", "published");
    const call = fake.mock.calls[0]!;
    const options = call[1]!;
    expect(options.cache).toBe("no-store");
    expect(new Headers(options.headers).get("cookie")).toBeNull();
    expect(new Headers(options.headers).get("authorization")).toBe(`Bearer ${key}`);
    expect(new Headers(options.headers).get("apikey")).toBe(key);
  });
  it("uses blocking loaders without preload or retained route data", () => {
    expect(freshPublicContent).toMatchObject({
      staleTime: 0,
      gcTime: 0,
      preload: false,
      preloadStaleTime: 0,
      preloadGcTime: 0,
      shouldReload: true,
      staleReloadMode: "blocking",
    });
  });
  it.each(["/", "/poesia", "/poesia/nuevo-poema", "/poesia/desconocido", "/publicaciones"])(
    "prevents shared caches on %s, including errors and 404",
    (path) => {
      for (const status of [200, 404, 503]) {
        const r = protectSessionResponse(
          new Request("https://example.invalid" + path),
          new Response("test", { status }),
        );
        expect(r.headers.get("Cache-Control")).toBe("private, no-store");
        expect(r.headers.get("Vercel-CDN-Cache-Control")).toBe("no-store");
      }
    },
  );
});
