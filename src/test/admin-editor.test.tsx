import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminWorkspace, type AdminApi } from "@/components/admin/AdminWorkspace";
import { emptyPoem } from "@/lib/admin/poems";
import type { EditablePoem, Workspace } from "@/lib/admin/poems";
const uuid = "10000000-0000-4000-8000-000000000001";
const poem: EditablePoem = {
  id: uuid,
  title: "Prueba local",
  slug: "prueba-local",
  body: "  Línea de prueba\n\nOtra estrofa\n",
  description: null,
  written_on: null,
  written_on_original: null,
  status: "draft",
  published_at: null,
  first_published_at: null,
  updated_at: "2026-11-22T10:00:00Z",
};
const ready: Workspace = { mode: "ready", poems: [poem], total: 1 };
function setup(initial: Workspace = ready) {
  const api: AdminApi = {
    workspace: vi.fn().mockResolvedValue(ready),
    login: vi.fn().mockResolvedValue({ ok: true, data: null }),
    logout: vi.fn().mockResolvedValue({ ok: true, data: null }),
    poem: vi.fn().mockResolvedValue({ ok: true, data: poem }),
    save: vi.fn().mockImplementation(async (input) => ({
      ok: true,
      data: { ...poem, ...input, updated_at: "2026-11-22T11:00:00Z" },
    })),
  };
  const onDirtyChange = vi.fn(),
    onSessionChange = vi.fn();
  render(
    <AdminWorkspace
      initial={initial}
      api={api}
      onDirtyChange={onDirtyChange}
      onSessionChange={onSessionChange}
    />,
  );
  return { api, onDirtyChange, onSessionChange };
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
async function open() {
  fireEvent.click(screen.getByRole("button", { name: /Prueba local/ }));
  await screen.findByLabelText("Texto del poema");
}
describe("Private workspace and editor", () => {
  it("shows only the login form for an anonymous visitor", () => {
    setup({ mode: "login" });
    expect(screen.getByRole("form", { name: "Inicio de sesión" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nuevo poema" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "password");
  });
  it("clears the password and shows a rejected login without exposing credentials", async () => {
    const h = setup({ mode: "login" });
    vi.mocked(h.api.login).mockResolvedValue({ ok: false, error: "Acceso rechazado." });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "synthetic@example.invalid" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "synthetic-secret" },
    });
    fireEvent.submit(screen.getByRole("form", { name: "Inicio de sesión" }));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Contraseña")).toHaveValue("");
    expect(h.onSessionChange).not.toHaveBeenCalled();
    expect(screen.queryByText("synthetic-secret")).not.toBeInTheDocument();
  });
  it("switches the session after successful login and logout", async () => {
    const h = setup({ mode: "login" });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "synthetic@example.invalid" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "synthetic-secret" },
    });
    fireEvent.submit(screen.getByRole("form", { name: "Inicio de sesión" }));
    await waitFor(() => expect(h.onSessionChange).toHaveBeenCalledOnce());
    cleanup();
    const logged = setup();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(logged.onSessionChange).toHaveBeenCalledOnce());
    expect(screen.queryByText("Prueba local")).not.toBeInTheDocument();
  });
  it("blocks the editor for a signed-in non-administrator", () => {
    setup({ mode: "denied" });
    expect(screen.getByText("Esta cuenta no tiene acceso.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nuevo poema" })).not.toBeInTheDocument();
  });
  it("shows an empty library without invented poems", () => {
    setup({ mode: "ready", poems: [], total: 0 });
    expect(screen.getByText("Tu biblioteca empieza aquí.")).toBeInTheDocument();
    expect(screen.queryByText("Prueba local")).not.toBeInTheDocument();
  });
  it("opens, edits and previews exact stanzas and escapes HTML", async () => {
    const h = setup();
    await open();
    const text = "  Texto de prueba\n\n<script>unsafe()</script>\n";
    fireEvent.change(screen.getByLabelText("Texto del poema"), { target: { value: text } });
    fireEvent.click(screen.getByRole("tab", { name: "Previsualizar" }));
    expect(screen.getByTestId("poem-preview").textContent).toBe(text);
    expect(screen.getByTestId("poem-preview").querySelector("script")).toBeNull();
    expect(h.api.save).not.toHaveBeenCalled();
    expect(h.onDirtyChange).toHaveBeenCalledWith(true);
  });
  it("saves exact text as a draft and clears the dirty indicator", async () => {
    const h = setup();
    await open();
    const text = "Primera línea\n\n  Segunda estrofa\n";
    fireEvent.change(screen.getByLabelText("Texto del poema"), { target: { value: text } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    await screen.findByRole("status");
    expect(h.api.save).toHaveBeenCalledWith(
      expect.objectContaining({
        body: text,
        status: "draft",
        id: uuid,
        expectedUpdatedAt: poem.updated_at,
      }),
    );
    expect(screen.getByText("Todos los cambios guardados")).toBeInTheDocument();
  });
  it("requires explicit confirmation to publish and keeps a published slug read-only", async () => {
    const h = setup();
    vi.mocked(h.api.save).mockResolvedValue({
      ok: true,
      data: { ...poem, status: "published", first_published_at: poem.updated_at },
    });
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));
    expect(h.api.save).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Confirmar publicación",
      }),
    );
    await screen.findByRole("status");
    expect(h.api.save).toHaveBeenCalledWith(expect.objectContaining({ status: "published" }));
    expect(screen.getByLabelText("Dirección del poema")).toHaveAttribute("readonly");
    fireEvent.click(screen.getByRole("button", { name: "Retirar publicación" }));
    fireEvent.click(screen.getByRole("button", { name: "Retirar y guardar borrador" }));
    await waitFor(() =>
      expect(h.api.save).toHaveBeenLastCalledWith(expect.objectContaining({ status: "draft" })),
    );
  });
  it("keeps unsaved text when saving fails", async () => {
    const h = setup();
    vi.mocked(h.api.save).mockResolvedValue({ ok: false, error: "No se ha podido guardar." });
    await open();
    fireEvent.change(screen.getByLabelText("Texto del poema"), {
      target: { value: "Prueba sin guardar\n\n" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Texto del poema")).toHaveValue("Prueba sin guardar\n\n");
    expect(screen.getByText("Cambios sin guardar")).toBeInTheDocument();
  });
  it("does not discard changes without confirmation", async () => {
    setup();
    await open();
    fireEvent.change(screen.getByLabelText("Texto del poema"), {
      target: { value: "Cambio local" },
    });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Nuevo poema" }));
    expect(confirm).toHaveBeenCalled();
    expect(screen.getByLabelText("Texto del poema")).toHaveValue("Cambio local");
  });
  it("creates a new draft with a suggested, editable slug and no invented date", async () => {
    const h = setup();
    fireEvent.click(screen.getByRole("button", { name: "Nuevo poema" }));
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Prueba de edición" } });
    expect(screen.getByLabelText("Dirección del poema")).toHaveValue("prueba-de-edicion");
    expect(screen.getByLabelText(/Fecha de escritura/)).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    await screen.findByRole("status");
    expect(h.api.save).toHaveBeenCalledWith({
      ...emptyPoem(),
      title: "Prueba de edición",
      slug: "prueba-de-edicion",
    });
  });
  it("filters the list and hides prior data when authorization expires", async () => {
    const h = setup();
    vi.mocked(h.api.workspace).mockResolvedValue({ mode: "login" });
    fireEvent.change(screen.getByLabelText("Mostrar"), { target: { value: "draft" } });
    await screen.findByRole("form", { name: "Inicio de sesión" });
    expect(h.api.workspace).toHaveBeenCalledWith(0, "draft");
    expect(screen.queryByText("Prueba local")).not.toBeInTheDocument();
  });
});

describe("Editor validation and recovery", () => {
  it("opens metadata and reports an invalid direction instead of silently blocking submission", async () => {
    const h = setup();
    fireEvent.click(screen.getByRole("button", { name: "Nuevo poema" }));
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Prueba" } });
    fireEvent.change(screen.getByLabelText("Dirección del poema"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Dirección del poema").closest("details")).toHaveAttribute("open");
    expect(h.api.save).not.toHaveBeenCalled();
  });
  it("does not publish an empty body", async () => {
    const h = setup();
    await open();
    fireEvent.change(screen.getByLabelText("Texto del poema"), { target: { value: " \n\n" } });
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar publicación" }));
    await screen.findByRole("alert");
    expect(h.api.save).not.toHaveBeenCalled();
  });
  it("preserves unsaved text when refreshing the list fails", async () => {
    const h = setup();
    await open();
    fireEvent.change(screen.getByLabelText("Texto del poema"), {
      target: { value: "Texto local sin guardar" },
    });
    vi.mocked(h.api.workspace).mockResolvedValue({ mode: "error" });
    fireEvent.change(screen.getByLabelText("Mostrar"), { target: { value: "published" } });
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Texto del poema")).toHaveValue("Texto local sin guardar");
  });
  it("supports keyboard navigation between writing and preview", async () => {
    setup();
    await open();
    const writing = screen.getByRole("tab", { name: "Escribir" });
    fireEvent.keyDown(writing, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Previsualizar" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.keyDown(screen.getByRole("tab", { name: "Previsualizar" }), { key: "Home" });
    expect(screen.getByRole("tab", { name: "Escribir" })).toHaveAttribute("aria-selected", "true");
  });
});
