import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Eye,
  FilePenLine,
  LogOut,
  Plus,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";
import { emptyPoem, PAGE_SIZE, poemToInput, poemSchema, suggestSlug } from "@/lib/admin/poems";
import type { EditablePoem, Result, SavePoemInput, Workspace } from "@/lib/admin/poems";

export type AdminApi = {
  workspace: (page: number, status: "all" | "draft" | "published") => Promise<Workspace>;
  login: (email: string, password: string) => Promise<Result<null>>;
  logout: () => Promise<Result<null>>;
  poem: (id: string) => Promise<Result<EditablePoem>>;
  save: (input: SavePoemInput) => Promise<Result<EditablePoem>>;
};
type Props = {
  initial: Workspace;
  api: AdminApi;
  onDirtyChange: (dirty: boolean) => void;
  onSessionChange: () => void;
};
type Notice = { text: string; error: boolean } | null;
const statusLabel = (status: string) => (status === "published" ? "Publicado" : "Borrador");

export function AdminWorkspace({ initial, api, onDirtyChange, onSessionChange }: Props) {
  const [workspace, setWorkspace] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [draft, setDraft] = useState<SavePoemInput | null>(null);
  const [baseline, setBaseline] = useState("");
  const [frozenSlug, setFrozenSlug] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [preview, setPreview] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<"publish" | "withdraw" | null>(null);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const editorHeading = useRef<HTMLHeadingElement>(null);
  const dirty = draft !== null && JSON.stringify(draft) !== baseline;
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  const error = (text = "No se ha podido completar la operación. Inténtalo de nuevo.") =>
    setNotice({ text, error: true });
  const canLeave = () =>
    !dirty || window.confirm("Hay cambios sin guardar. ¿Quieres descartarlos?");
  function openEditor(input: SavePoemInput, frozen: boolean) {
    setDraft(input);
    setBaseline(JSON.stringify(input));
    setFrozenSlug(frozen);
    setSlugTouched(input.id !== null);
    setPreview(false);
    setNotice(null);
    setConfirmation(null);
    requestAnimationFrame(() => editorHeading.current?.focus());
  }
  async function refresh(nextPage = page, nextFilter = filter) {
    const result = await api.workspace(nextPage, nextFilter);
    if (result.mode === "error") {
      error(
        "No se ha podido actualizar el listado. Tus cambios siguen en el editor; revisa la conexión.",
      );
      return false;
    }
    if (result.mode !== "ready") {
      // Do not retain the previous user's drafts after revocation/session expiry.
      setWorkspace(result);
      setDraft(null);
      setBaseline("");
    } else setWorkspace(result);
    return result.mode === "ready";
  }
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    const submittedPassword = password;
    setPassword("");
    try {
      const result = await api.login(email, submittedPassword);
      if (!result.ok) error(result.error);
      else onSessionChange();
    } catch {
      error("No se ha podido iniciar sesión. Revisa la conexión e inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (!canLeave()) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await api.logout();
      if (!result.ok) error(result.error);
      else {
        setDraft(null);
        setWorkspace({ mode: "login" });
        onDirtyChange(false);
        onSessionChange();
      }
    } catch {
      error("No se ha podido cerrar la sesión. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }
  async function openPoem(id: string) {
    if (!canLeave()) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await api.poem(id);
      if (!result.ok) error(result.error);
      else openEditor(poemToInput(result.data), result.data.first_published_at !== null);
    } catch {
      error();
    } finally {
      setBusy(false);
    }
  }
  async function changePage(nextPage: number, nextFilter = filter) {
    setBusy(true);
    setNotice(null);
    try {
      if (await refresh(nextPage, nextFilter)) {
        setPage(nextPage);
        setFilter(nextFilter);
      }
    } catch {
      error();
    } finally {
      setBusy(false);
    }
  }
  async function save(status: "draft" | "published") {
    if (!draft) return;
    const input = { ...draft, status };
    if (!poemSchema.safeParse(input).success) {
      error(
        "Completa el título y una dirección válida. Para publicar, añade el texto. Revisa también los límites de los campos.",
      );
      setConfirmation(null);
      setPreview(false);
      setMetadataOpen(true);
      return;
    }
    setBusy(true);
    setSaving(true);
    setNotice(null);
    setConfirmation(null);
    try {
      const result = await api.save(input);
      if (!result.ok) {
        error(result.error);
        return;
      }
      const saved = poemToInput(result.data);
      setDraft(saved);
      setBaseline(JSON.stringify(saved));
      setFrozenSlug(result.data.first_published_at !== null);
      onDirtyChange(false);
      setNotice({
        text:
          status === "published"
            ? "Poema publicado. Ya está disponible en la web pública."
            : draft.status === "published"
              ? "Poema retirado de publicación y guardado como borrador."
              : "Borrador guardado. Tus versos y estrofas se han conservado.",
        error: false,
      });
      try {
        if (await refresh(0, filter)) setPage(0);
        else
          error(
            "El poema se ha guardado, pero no se ha podido actualizar el listado. Vuelve a cargarlo.",
          );
      } catch {
        error(
          "El poema se ha guardado, pero no se ha podido actualizar el listado. Vuelve a cargarlo.",
        );
      }
    } catch {
      error(
        "No se ha podido guardar. Tus cambios siguen en el editor; comprueba la conexión e inténtalo de nuevo.",
      );
    } finally {
      setSaving(false);
      setBusy(false);
    }
  }
  const update = <K extends keyof SavePoemInput>(key: K, value: SavePoemInput[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setNotice(null);
  };

  return (
    <section
      className="admin-workspace mx-auto max-w-7xl px-5 pb-20 pt-7 sm:px-10"
      aria-label="Administración de poemas"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <p className="eyebrow flex items-center gap-2">
          <ShieldCheck size={15} aria-hidden /> Espacio privado · Trinity
        </p>
        {workspace.mode !== "login" && (
          <button type="button" className="admin-text-button" disabled={busy} onClick={logout}>
            <LogOut size={15} aria-hidden /> Cerrar sesión
          </button>
        )}
      </div>
      {notice && (
        <div
          className={`admin-notice mt-5 ${notice.error ? "admin-notice-error" : ""}`}
          role={notice.error ? "alert" : "status"}
        >
          {!notice.error && <Check size={18} aria-hidden />}
          <span>{notice.text}</span>
        </div>
      )}
      {workspace.mode === "login" ? (
        <div className="mx-auto grid max-w-4xl gap-10 py-14 lg:grid-cols-2 lg:gap-20 lg:py-20">
          <div>
            <p className="eyebrow text-primary">Gestor de poemas</p>
            <h1 className="mt-5 text-5xl leading-tight sm:text-6xl">
              Un espacio para
              <br />
              <em className="text-primary">tus palabras.</em>
            </h1>
            <p className="mt-6 max-w-sm leading-relaxed text-muted-foreground">
              Escribe, cuida tus borradores y decide cuándo compartir cada poema.
            </p>
            <p className="mt-10 font-script text-5xl text-primary">Trinity</p>
          </div>
          <form
            onSubmit={login}
            className="admin-surface self-center p-7 sm:p-9"
            aria-label="Inicio de sesión"
          >
            <h2 className="text-3xl">Bienvenida de nuevo</h2>
            <p className="mb-7 mt-2 text-sm text-muted-foreground">
              Accede con tu cuenta autorizada.
            </p>
            <fieldset disabled={busy} className="space-y-5">
              <label className="admin-label">
                Email
                <input
                  className="admin-field"
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="admin-label">
                Contraseña
                <input
                  className="admin-field"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  maxLength={1024}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button className="admin-button w-full" type="submit">
                {busy ? "Entrando…" : "Entrar al gestor"}
                <ArrowLeft size={16} className="rotate-180" aria-hidden />
              </button>
            </fieldset>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              Acceso reservado a Trinity. Si no recuerdas tu contraseña, solicita su recuperación a
              la persona responsable del proyecto.
            </p>
          </form>
        </div>
      ) : workspace.mode === "denied" ? (
        <div className="mx-auto max-w-xl py-20 text-center">
          <h1 className="text-4xl">Esta cuenta no tiene acceso.</h1>
          <p className="mt-5 text-muted-foreground">
            Iniciar sesión no concede permisos de administración. Cierra la sesión para acceder con
            una cuenta autorizada.
          </p>
        </div>
      ) : workspace.mode === "error" ? (
        <div className="mx-auto max-w-xl py-20 text-center">
          <h1 className="text-4xl">No se ha podido abrir el gestor.</h1>
          <p className="mt-5 text-muted-foreground">
            No hemos podido verificar el acceso o cargar los poemas. Comprueba la conexión y vuelve
            a intentarlo.
          </p>
          <button className="admin-button mt-6" disabled={busy} onClick={() => changePage(0)}>
            Volver a intentar
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-5 py-8">
            <div>
              <p className="eyebrow text-primary">Tu biblioteca</p>
              <h1 className="mt-2 text-5xl italic">Poemas</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Un lugar para escribir y volver a tus versos.
              </p>
            </div>
            <button
              type="button"
              className="admin-button"
              disabled={busy}
              onClick={() => {
                if (canLeave()) openEditor(emptyPoem(), false);
              }}
            >
              <Plus size={17} aria-hidden /> Nuevo poema
            </button>
          </div>
          <div
            className="grid items-start gap-6 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]"
            aria-busy={busy}
          >
            <aside className="admin-surface overflow-hidden" aria-label="Listado de poemas">
              <div className="border-b border-border p-5">
                <label className="admin-label text-xs">
                  Mostrar
                  <select
                    className="admin-field"
                    value={filter}
                    disabled={busy}
                    onChange={(e) => changePage(0, e.target.value as typeof filter)}
                  >
                    <option value="all">Todos los estados</option>
                    <option value="draft">Borradores</option>
                    <option value="published">Publicados</option>
                  </select>
                </label>
                <p className="mt-3 text-xs text-muted-foreground">
                  {workspace.total} {workspace.total === 1 ? "poema" : "poemas"}
                </p>
              </div>
              {workspace.poems.length ? (
                <ul className="divide-y divide-border">
                  {workspace.poems.map((poem) => (
                    <li key={poem.id}>
                      <button
                        className={`admin-poem-row ${draft?.id === poem.id ? "admin-poem-selected" : ""}`}
                        disabled={busy}
                        onClick={() => openPoem(poem.id)}
                        aria-current={draft?.id === poem.id ? "true" : undefined}
                      >
                        <span className="block font-serif text-2xl italic leading-tight">
                          {poem.title}
                        </span>
                        <span
                          className={`admin-badge mt-3 ${poem.status === "published" ? "admin-badge-published" : ""}`}
                        >
                          {statusLabel(poem.status)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-6 py-10 text-center">
                  <BookOpen
                    className="mx-auto text-primary"
                    size={25}
                    strokeWidth={1.3}
                    aria-hidden
                  />
                  <p className="mt-4 font-serif text-2xl">
                    {filter === "all"
                      ? "Tu biblioteca empieza aquí."
                      : "No hay poemas en este estado."}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {filter === "all"
                      ? "Crea un poema para empezar a escribir."
                      : "Elige otro estado para ver más poemas."}
                  </p>
                </div>
              )}
              {(workspace.total > PAGE_SIZE || page > 0) && (
                <div className="flex items-center justify-between gap-2 border-t border-border p-4 text-xs">
                  <button
                    className="admin-text-button"
                    disabled={busy || page === 0}
                    onClick={() => changePage(page - 1)}
                  >
                    Anterior
                  </button>
                  <span>
                    {page + 1} / {Math.max(1, Math.ceil(workspace.total / PAGE_SIZE))}
                  </span>
                  <button
                    className="admin-text-button"
                    disabled={busy || (page + 1) * PAGE_SIZE >= workspace.total}
                    onClick={() => changePage(page + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </aside>
            {draft ? (
              <section className="admin-surface min-w-0" aria-label="Editor de poema">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-6 py-5 sm:px-8">
                  <div>
                    <h2 className="font-serif text-2xl" ref={editorHeading} tabIndex={-1}>
                      {draft.id ? "Editar poema" : "Nuevo poema"}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dirty
                        ? "Cambios sin guardar"
                        : draft.id
                          ? "Todos los cambios guardados"
                          : "Todavía no se ha guardado"}
                    </p>
                  </div>
                  <span
                    className={`admin-badge ${draft.status === "published" ? "admin-badge-published" : ""}`}
                  >
                    {statusLabel(draft.status)}
                  </span>
                </div>
                <div
                  className="flex gap-6 border-b border-border px-6 sm:px-8"
                  role="tablist"
                  aria-label="Modo de trabajo"
                  onKeyDown={(e) => {
                    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
                    e.preventDefault();
                    const next = e.key === "Home" ? false : e.key === "End" ? true : !preview;
                    setPreview(next);
                    document.getElementById(next ? "preview-tab" : "write-tab")?.focus();
                  }}
                >
                  <button
                    className="admin-tab"
                    id="write-tab"
                    role="tab"
                    aria-selected={!preview}
                    tabIndex={preview ? -1 : 0}
                    aria-controls="poem-panel"
                    onClick={() => setPreview(false)}
                  >
                    <FilePenLine size={15} aria-hidden /> Escribir
                  </button>
                  <button
                    className="admin-tab"
                    id="preview-tab"
                    role="tab"
                    aria-selected={preview}
                    tabIndex={preview ? 0 : -1}
                    aria-controls="poem-panel"
                    onClick={() => setPreview(true)}
                  >
                    <Eye size={15} aria-hidden /> Previsualizar
                  </button>
                </div>
                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    void save(draft.status);
                  }}
                >
                  <fieldset disabled={busy || confirmation !== null} className="min-w-0">
                    <div
                      id="poem-panel"
                      tabIndex={0}
                      role="tabpanel"
                      aria-labelledby={preview ? "preview-tab" : "write-tab"}
                      className="px-6 py-7 sm:px-8"
                    >
                      {preview ? (
                        <article className="min-h-96 py-4" aria-label="Vista previa privada">
                          <p className="eyebrow">
                            Vista previa privada ·{" "}
                            {dirty ? "incluye cambios sin guardar" : "contenido del editor"}
                          </p>
                          <h3 className="mt-7 break-words text-4xl italic sm:text-5xl">
                            {draft.title || "Sin título"}
                          </h3>
                          {draft.writtenOnOriginal && (
                            <p className="mt-3 text-xs text-muted-foreground">
                              {draft.writtenOnOriginal}
                            </p>
                          )}
                          <p
                            data-testid="poem-preview"
                            className="poem mt-9 break-words text-xl leading-[1.8] sm:text-2xl"
                            style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                          >
                            {draft.body}
                          </p>
                          {!draft.body && (
                            <p className="mt-9 text-muted-foreground">
                              El poema todavía no tiene texto.
                            </p>
                          )}
                          <p className="mt-12 font-script text-5xl text-primary">Trinity</p>
                        </article>
                      ) : (
                        <div className="space-y-6">
                          <label className="admin-label">
                            Título
                            <input
                              className="admin-field font-serif text-2xl"
                              name="title"
                              required
                              maxLength={300}
                              value={draft.title}
                              onChange={(e) => {
                                const title = e.target.value;
                                setDraft((current) =>
                                  current
                                    ? {
                                        ...current,
                                        title,
                                        ...(!current.id && !slugTouched
                                          ? { slug: suggestSlug(title) }
                                          : {}),
                                      }
                                    : current,
                                );
                                setNotice(null);
                              }}
                            />
                          </label>
                          <label className="admin-label">
                            Texto del poema
                            <textarea
                              className="admin-field admin-poem-input"
                              name="body"
                              rows={16}
                              maxLength={200000}
                              value={draft.body}
                              spellCheck
                              lang="es"
                              aria-describedby="verse-help"
                              onChange={(e) => update("body", e.target.value)}
                            />
                          </label>
                          <p id="verse-help" className="-mt-3 text-xs text-muted-foreground">
                            Cada salto de línea y cada línea en blanco forman parte del poema. El
                            guardado conserva el texto tal como lo escribes.
                          </p>
                          <details
                            className="border-t border-border pt-4"
                            open={metadataOpen}
                            onToggle={(e) => setMetadataOpen(e.currentTarget.open)}
                          >
                            <summary className="cursor-pointer text-sm text-primary">
                              Dirección, descripción y fecha
                            </summary>
                            <div className="mt-5 space-y-5">
                              <label className="admin-label">
                                Dirección del poema
                                <input
                                  className="admin-field"
                                  name="slug"
                                  required
                                  maxLength={160}
                                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                                  readOnly={frozenSlug}
                                  value={draft.slug}
                                  onChange={(e) => {
                                    setSlugTouched(true);
                                    update("slug", e.target.value);
                                  }}
                                  aria-describedby="slug-help"
                                />
                              </label>
                              <p id="slug-help" className="text-xs text-muted-foreground">
                                {frozenSlug
                                  ? "La dirección queda fija después de la primera publicación, incluso si retiras el poema."
                                  : "Usa letras minúsculas sin tildes, números y guiones. Quedará fija al publicar por primera vez."}
                              </p>
                              <label className="admin-label">
                                Descripción breve{" "}
                                <span className="font-normal text-muted-foreground">
                                  (opcional)
                                </span>
                                <textarea
                                  className="admin-field"
                                  rows={3}
                                  maxLength={2000}
                                  value={draft.description}
                                  onChange={(e) => update("description", e.target.value)}
                                />
                              </label>
                              <div className="grid gap-5 sm:grid-cols-2">
                                <label className="admin-label">
                                  Fecha de escritura{" "}
                                  <span className="font-normal text-muted-foreground">
                                    (opcional)
                                  </span>
                                  <input
                                    className="admin-field"
                                    type="date"
                                    value={draft.writtenOn}
                                    onChange={(e) => update("writtenOn", e.target.value)}
                                  />
                                </label>
                                <label className="admin-label">
                                  Fecha tal como quieres mostrarla{" "}
                                  <span className="font-normal text-muted-foreground">
                                    (opcional)
                                  </span>
                                  <input
                                    className="admin-field"
                                    maxLength={300}
                                    value={draft.writtenOnOriginal}
                                    onChange={(e) => update("writtenOnOriginal", e.target.value)}
                                  />
                                </label>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Puedes dejar las fechas vacías si no las conoces.
                              </p>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 border-t border-border px-6 py-5 sm:px-8">
                      <button className="admin-button" type="submit">
                        <Save size={16} aria-hidden />
                        {saving
                          ? "Guardando…"
                          : draft.status === "published"
                            ? "Guardar cambios"
                            : "Guardar borrador"}
                      </button>
                      {draft.status === "draft" ? (
                        <button
                          className="admin-button admin-button-secondary"
                          type="button"
                          onClick={() => setConfirmation("publish")}
                        >
                          <Send size={15} aria-hidden /> Publicar
                        </button>
                      ) : (
                        <button
                          className="admin-text-button"
                          type="button"
                          onClick={() => setConfirmation("withdraw")}
                        >
                          Retirar publicación
                        </button>
                      )}
                    </div>
                  </fieldset>
                </form>
                {confirmation && (
                  <div
                    className="admin-confirm mx-6 mb-6 p-5 sm:mx-8"
                    role="alertdialog"
                    aria-modal="false"
                    aria-labelledby="confirm-heading"
                    aria-describedby="confirm-description"
                  >
                    <h3 id="confirm-heading" className="text-2xl">
                      {confirmation === "publish"
                        ? "¿Publicar este poema?"
                        : "¿Retirar la publicación?"}
                    </h3>
                    <p id="confirm-description" className="mt-2 text-sm leading-relaxed">
                      {confirmation === "publish"
                        ? "Se guardarán tus cambios y el poema quedará visible en la web pública."
                        : "Se guardarán tus cambios y el poema volverá a ser un borrador privado. Su dirección se conservará."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        className="admin-button admin-button-secondary"
                        type="button"
                        autoFocus
                        onClick={() => setConfirmation(null)}
                      >
                        Cancelar
                      </button>
                      <button
                        className="admin-button"
                        type="button"
                        onClick={() => save(confirmation === "publish" ? "published" : "draft")}
                      >
                        {confirmation === "publish"
                          ? "Confirmar publicación"
                          : "Retirar y guardar borrador"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <div className="admin-surface flex min-h-96 flex-col items-center justify-center px-7 py-16 text-center">
                <FilePenLine className="text-primary" size={32} strokeWidth={1.2} aria-hidden />
                <h2 className="mt-6 text-3xl italic">Dale espacio a tus palabras.</h2>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Elige un poema para seguir escribiendo o crea uno nuevo. Los borradores son
                  privados hasta que decidas publicarlos.
                </p>
                <button
                  className="admin-text-button mt-7"
                  disabled={busy}
                  onClick={() => openEditor(emptyPoem(), false)}
                >
                  <Plus size={16} aria-hidden /> Escribir un poema
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
