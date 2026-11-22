import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { flushSync } from "react-dom";
import { AdminWorkspace, type AdminApi } from "@/components/admin/AdminWorkspace";
import adminCss from "@/components/admin/admin.css?url";
import { loadPoem, loadWorkspace, loginAdmin, logoutAdmin, savePoem } from "@/lib/admin/functions";

const api: AdminApi = {
  workspace: (page, status) => loadWorkspace({ data: { page, status } }),
  login: (email, password) => loginAdmin({ data: { email, password } }),
  logout: () => logoutAdmin(),
  poem: (id) => loadPoem({ data: { id } }),
  save: (input) => savePoem({ data: input }),
};
export const Route = createFileRoute("/admin")({
  loader: () => loadWorkspace({ data: { page: 0, status: "all" } }),
  staleTime: 0,
  gcTime: 0,
  preload: false,
  head: () => ({
    meta: [
      { title: "Espacio privado · Trinity" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
    links: [{ rel: "stylesheet", href: adminCss }],
  }),
  component: AdminPage,
  errorComponent: () => (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="text-4xl">No se ha podido abrir el gestor.</h1>
      <p className="mt-5">Comprueba la conexión y vuelve a intentarlo.</p>
      <a href="/admin" className="text-link mt-6">
        Volver a intentar
      </a>
    </div>
  ),
});
function AdminPage() {
  const initial = Route.useLoaderData();
  const [dirty, setDirty] = useState(false);
  useBlocker({
    shouldBlockFn: () =>
      dirty && !window.confirm("Hay cambios sin guardar. ¿Quieres descartarlos y salir?"),
    enableBeforeUnload: dirty,
  });
  const resetSession = useCallback(() => {
    flushSync(() => setDirty(false));
    window.location.assign("/admin");
  }, []);
  return (
    <AdminWorkspace
      initial={initial}
      api={api}
      onDirtyChange={setDirty}
      onSessionChange={resetSession}
    />
  );
}
