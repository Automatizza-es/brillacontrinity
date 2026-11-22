export function PublicContentError({ kind }: { kind: "poemas" | "publicaciones" }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-4xl">
        No se han podido cargar {kind === "poemas" ? "los poemas" : "las publicaciones"}.
      </h1>
      <p className="mt-5 text-muted-foreground">
        Hay un problema temporal de conexión. Vuelve a intentarlo en unos momentos.
      </p>
      <a className="text-link mt-8" href={kind === "poemas" ? "/poesia" : "/publicaciones"}>
        Volver a intentar
      </a>
    </div>
  );
}
