import type { SupabaseClient } from "@supabase/supabase-js";
import { PAGE_SIZE, POEM_FIELDS, SUMMARY_FIELDS, poemSchema } from "./poems";
import type { EditablePoem, PoemSummary, Result, SavePoemInput, Workspace } from "./poems";

const ACCESS_ERROR = "Tu sesión ha caducado o no tiene autorización. Vuelve a iniciar sesión.";
const CONNECTION_ERROR =
  "No se ha podido conectar. Inténtalo de nuevo; tus cambios siguen en el editor.";

/** No service-role client: every query retains the requesting user's RLS identity. */
export function createAdminService(getClient: () => SupabaseClient) {
  async function identity(client: SupabaseClient) {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) {
      if (
        !data.user &&
        (!error || error.name === "AuthSessionMissingError" || error.status === 401)
      )
        return "login" as const;
      return "error" as const;
    }
    const membership = await client
      .from("admin_users")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (membership.error) return "error" as const;
    return membership.data ? ("ready" as const) : ("denied" as const);
  }
  async function authorized() {
    const client = getClient();
    if ((await identity(client)) !== "ready") throw new Error("ACCESS_DENIED");
    return client;
  }
  return {
    async workspace(page: number, status: "all" | "draft" | "published"): Promise<Workspace> {
      try {
        const client = getClient();
        const mode = await identity(client);
        if (mode !== "ready") return { mode };
        let query = client.from("poems").select(SUMMARY_FIELDS, { count: "exact" });
        if (status !== "all") query = query.eq("status", status);
        const { data, count, error } = await query
          .order("updated_at", { ascending: false })
          .order("id")
          .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
        if (error) return { mode: "error" };
        return { mode: "ready", poems: data as unknown as PoemSummary[], total: count ?? 0 };
      } catch {
        return { mode: "error" };
      }
    },
    async login(email: string, password: string): Promise<Result<null>> {
      try {
        const client = getClient();
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error)
          return {
            ok: false,
            error:
              "No se ha podido iniciar sesión. Revisa el email y la contraseña e inténtalo de nuevo.",
          };
        if ((await identity(client)) !== "ready") {
          await client.auth.signOut({ scope: "local" });
          return { ok: false, error: "Esta cuenta no tiene acceso al espacio de administración." };
        }
        return { ok: true, data: null };
      } catch {
        return { ok: false, error: "No se ha podido iniciar sesión. Inténtalo de nuevo." };
      }
    },
    async logout(): Promise<Result<null>> {
      try {
        const { error } = await getClient().auth.signOut({ scope: "local" });
        return error
          ? { ok: false, error: "No se ha podido cerrar la sesión. Inténtalo de nuevo." }
          : { ok: true, data: null };
      } catch {
        return { ok: false, error: "No se ha podido cerrar la sesión. Inténtalo de nuevo." };
      }
    },
    async poem(id: string): Promise<Result<EditablePoem>> {
      try {
        const client = await authorized();
        const { data, error } = await client
          .from("poems")
          .select(POEM_FIELDS)
          .eq("id", id)
          .single();
        if (error || !data)
          return {
            ok: false,
            error: "No se ha podido abrir el poema. Actualiza el listado e inténtalo de nuevo.",
          };
        return { ok: true, data: data as EditablePoem };
      } catch {
        return { ok: false, error: ACCESS_ERROR };
      }
    },
    async save(input: SavePoemInput): Promise<Result<EditablePoem>> {
      try {
        const parsed = poemSchema.safeParse(input);
        if (!parsed.success)
          return {
            ok: false,
            error:
              "Revisa el título, la dirección y los campos del poema. Para publicar, añade también el texto.",
          };
        const client = await authorized();
        const {
          id,
          expectedUpdatedAt,
          title,
          slug,
          body,
          description,
          writtenOn,
          writtenOnOriginal,
          status,
        } = parsed.data;
        const fields = {
          title,
          slug,
          body,
          description: description || null,
          written_on: writtenOn || null,
          written_on_original: writtenOnOriginal || null,
          status,
        };
        const query = id
          ? client.from("poems").update(fields).eq("id", id).eq("updated_at", expectedUpdatedAt!)
          : client.from("poems").insert(fields);
        const { data, error } = await query.select(POEM_FIELDS).maybeSingle();
        if (error) {
          const message =
            error.code === "23505"
              ? "Ya existe un poema con esa dirección. Elige otra."
              : error.code === "23514"
                ? "Revisa los campos. La dirección de un poema que ya se ha publicado no se puede cambiar."
                : error.code === "42501"
                  ? ACCESS_ERROR
                  : CONNECTION_ERROR;
          return { ok: false, error: message };
        }
        if (!data)
          return {
            ok: false,
            error:
              "El poema ha cambiado en otra pestaña. Conserva tu texto y vuelve a abrirlo antes de guardar.",
          };
        return { ok: true, data: data as EditablePoem };
      } catch {
        return {
          ok: false,
          error:
            "No se ha podido guardar. Comprueba tu sesión y conexión; tus cambios siguen en el editor.",
        };
      }
    },
  };
}
