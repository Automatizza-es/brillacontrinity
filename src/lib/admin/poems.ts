import { z } from "zod";

export type PoemStatus = "draft" | "published";
export type PoemSummary = {
  id: string;
  title: string;
  slug: string;
  status: PoemStatus;
  updated_at: string;
  first_published_at: string | null;
};
export type EditablePoem = PoemSummary & {
  body: string;
  description: string | null;
  written_on: string | null;
  written_on_original: string | null;
  published_at: string | null;
};
export type Workspace =
  | { mode: "login" }
  | { mode: "denied" }
  | { mode: "error" }
  | { mode: "ready"; poems: PoemSummary[]; total: number };
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export const listSchema = z.object({
  page: z.number().int().min(0).max(10000),
  status: z.enum(["all", "draft", "published"]),
});
export const idSchema = z.object({ id: z.string().uuid() });
export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(1024),
});
export const poemSchema = z
  .object({
    id: z.string().uuid().nullable(),
    expectedUpdatedAt: z.string().datetime({ offset: true }).nullable(),
    title: z
      .string()
      .min(1)
      .max(300)
      .refine((s) => s.trim().length > 0),
    slug: z
      .string()
      .min(1)
      .max(160)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    // Never trim, split, join or normalize the poem's body.
    body: z.string().max(200000),
    description: z.string().max(2000),
    writtenOn: z.string().refine((s) => {
      if (s === "") return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
      const date = new Date(`${s}T00:00:00Z`);
      return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === s;
    }),
    writtenOnOriginal: z.string().max(300),
    status: z.enum(["draft", "published"]),
  })
  .refine((v) => v.status !== "published" || v.body.trim().length > 0, {
    message: "Un poema publicado necesita texto.",
  })
  .refine((v) => (v.id === null) === (v.expectedUpdatedAt === null));
export type SavePoemInput = z.infer<typeof poemSchema>;
export const PAGE_SIZE = 20;
export const POEM_FIELDS =
  "id,title,slug,status,body,description,written_on,written_on_original,published_at,first_published_at,updated_at";
export const SUMMARY_FIELDS = "id,title,slug,status,updated_at,first_published_at";

/** Replace schema errors with a fixed message; never serialize input values. */
export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new Error("Solicitud no válida. Revisa los campos del formulario.");
  return parsed.data;
}
export function emptyPoem(): SavePoemInput {
  return {
    id: null,
    expectedUpdatedAt: null,
    title: "",
    slug: "",
    body: "",
    description: "",
    writtenOn: "",
    writtenOnOriginal: "",
    status: "draft",
  };
}
export function poemToInput(poem: EditablePoem): SavePoemInput {
  return {
    id: poem.id,
    expectedUpdatedAt: poem.updated_at,
    title: poem.title,
    slug: poem.slug,
    body: poem.body,
    description: poem.description ?? "",
    writtenOn: poem.written_on ?? "",
    writtenOnOriginal: poem.written_on_original ?? "",
    status: poem.status,
  };
}
export function suggestSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160)
    .replace(/-$/g, "");
}
