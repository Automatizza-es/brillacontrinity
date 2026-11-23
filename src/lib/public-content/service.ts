import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { validPoemSlug } from "./route-options";
import type { Poem } from "@/content/poems";
import type { Publication } from "@/content/publications";

const poemRow = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  written_on: z.string().nullable(),
  written_on_original: z.string().nullable(),
  publication_id: z.string().nullable(),
  sort_order: z.number(),
  status: z.literal("published"),
});
const detailRow = poemRow.extend({ body: z.string() });
const linkRow = z.object({
  label: z.string(),
  url: z
    .string()
    .url()
    .refine((s) => ["https:", "http:"].includes(new URL(s).protocol)),
});
const publicationRow = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  publisher: z.string(),
  place: z.string().nullable(),
  year: z.number(),
  kind: z.string(),
  role: z.string().nullable(),
  synopsis: z.string().nullable(),
  cover_url: z.string().nullable(),
  isbn: z.string().nullable(),
  purchase_links: z.array(linkRow),
});
export const POEM_SUMMARY_FIELDS =
  "id,slug,title,description,written_on,written_on_original,publication_id,sort_order,status";
export const PUBLICATION_FIELDS =
  "id,slug,title,publisher,place,year,kind,role,synopsis,cover_url,isbn,purchase_links";
export const PUBLIC_CONTENT_ERROR =
  "No se ha podido consultar el contenido publicado. Inténtalo de nuevo.";

type Row = z.infer<typeof poemRow>;
type Book = z.infer<typeof publicationRow>;
function mapPoem(row: Row & { body?: string }, books: Book[]): Poem {
  const book = books.find((b) => b.id === row.publication_id);
  if (row.publication_id && !book) throw new Error(PUBLIC_CONTENT_ERROR);
  const date =
    row.written_on_original ??
    (row.written_on
      ? new Intl.DateTimeFormat("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(row.written_on + "T00:00:00Z"))
      : undefined);
  return {
    slug: row.slug,
    title: row.title,
    ...(row.body !== undefined ? { text: row.body } : {}),
    ...(row.description !== null ? { description: row.description } : {}),
    ...(book ? { publication: book.slug } : {}),
    ...(date !== undefined ? { writtenOn: date } : {}),
  };
}
function mapPublication(row: Book, poems: Row[]): Publication {
  return {
    slug: row.slug,
    title: row.title,
    publisher: row.publisher,
    year: row.year,
    kind: row.kind,
    poemSlugs: poems.filter((p) => p.publication_id === row.id).map((p) => p.slug),
    purchaseLinks: row.purchase_links,
    ...(row.place !== null ? { place: row.place } : {}),
    ...(row.role !== null ? { role: row.role } : {}),
    ...(row.synopsis !== null ? { synopsis: row.synopsis } : {}),
    ...(row.cover_url !== null ? { coverUrl: row.cover_url } : {}),
    ...(row.isbn !== null ? { isbn: row.isbn } : {}),
  };
}
const BATCH = 200;
/** All failures propagate. Never fall back to static content or a previous result. */
export function createPublicContentService(getClient: () => SupabaseClient) {
  async function all<T>(
    schema: z.ZodType<T>,
    query: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>,
  ) {
    const result: T[] = [];
    for (let offset = 0; ; offset += BATCH) {
      const response = await query(offset, offset + BATCH - 1);
      if (response.error) throw new Error(PUBLIC_CONTENT_ERROR);
      const rows = z.array(schema).parse(response.data);
      result.push(...rows);
      if (rows.length < BATCH) return result;
    }
  }
  return {
    async catalog() {
      try {
        const client = getClient();
        const [poems, books] = await Promise.all([
          all(poemRow, (from, to) =>
            client
              .from("poems")
              .select(POEM_SUMMARY_FIELDS)
              .eq("status", "published")
              // Immutable server timestamp: edits and republication must not move poems.
              .order("first_published_at", { ascending: true, nullsFirst: true })
              .order("sort_order")
              .order("id")
              .range(from, to),
          ),
          all(publicationRow, (from, to) =>
            client
              .from("publications")
              .select(PUBLICATION_FIELDS)
              .order("year", { ascending: false })
              .order("slug")
              .range(from, to),
          ),
        ]);
        return {
          poems: poems.map((p) => mapPoem(p, books)),
          publications: books.map((b) => mapPublication(b, poems)),
        };
      } catch {
        throw new Error(PUBLIC_CONTENT_ERROR);
      }
    },
    async poem(slug: string) {
      try {
        if (!validPoemSlug(slug)) return null;
        const client = getClient();
        const response = await client
          .from("poems")
          .select(POEM_SUMMARY_FIELDS + ",body")
          .eq("status", "published")
          .eq("slug", slug)
          .maybeSingle();
        if (response.error) throw new Error(PUBLIC_CONTENT_ERROR);
        if (response.data === null) return null;
        const row = detailRow.parse(response.data);
        const books: Book[] = [];
        if (row.publication_id) {
          const book = await client
            .from("publications")
            .select(PUBLICATION_FIELDS)
            .eq("id", row.publication_id)
            .single();
          if (book.error) throw new Error(PUBLIC_CONTENT_ERROR);
          books.push(publicationRow.parse(book.data));
        }
        const poem = mapPoem(row, books);
        return { poem, publication: books[0] ? mapPublication(books[0], [row]) : null };
      } catch {
        throw new Error(PUBLIC_CONTENT_ERROR);
      }
    },
  };
}
