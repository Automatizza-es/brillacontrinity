import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { pageMeta } from "@/lib/seo";
import { getPoem } from "@/content/poems";
import { getPublication } from "@/content/publications";

export const Route = createFileRoute("/poesia/$slug")({
  loader: ({ params }) => {
    const poem = getPoem(params.slug);
    if (!poem) throw notFound();
    return { poem };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageMeta(
          loaderData.poem.title,
          loaderData.poem.text
            ? `«${loaderData.poem.text.split("\n").slice(0, 2).join(" ")}» — poema de Trinity.`
            : `${loaderData.poem.title}, poema de Trinidad López · Trinity.`,
        )
      : { meta: [{ title: "Poema no encontrado · Trinity" }, { name: "robots", content: "noindex" }] },
  component: PoemPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="font-serif text-3xl">Este poema no existe.</p>
      <Link to="/poesia" className="text-link mt-8">Volver a Poesía</Link>
    </div>
  ),
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="font-serif text-3xl">No se ha podido cargar el poema.</p>
      <Link to="/poesia" className="text-link mt-8">Volver a Poesía</Link>
    </div>
  ),
});

function PoemPage() {
  const { poem } = Route.useLoaderData();
  const pub = poem.publication ? getPublication(poem.publication) : undefined;
  return (
    <article className="mx-auto max-w-2xl px-6 pb-24 pt-12 sm:px-10 lg:pt-20">
      <Link to="/poesia" className="text-link">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Poesía
      </Link>
      <h1 className="fade-up mt-12 text-5xl italic leading-tight sm:text-6xl">{poem.title}</h1>
      {poem.provisionalTitle && <p className="eyebrow mt-3">Título provisional</p>}
      {poem.writtenOn && <p className="eyebrow mt-3">Escrito el {poem.writtenOn}</p>}
      <div className="fade-up mt-12">
        {poem.text ? (
          <p className="poem text-xl leading-[1.7] sm:text-2xl">{poem.text}</p>
        ) : null}
      </div>
      <p className="mt-14 font-script text-5xl leading-none text-rose">Trinity</p>
      {pub && (
        <p className="eyebrow mt-10">
          Publicado en{" "}
          <Link to="/publicaciones" className="text-mist hover:text-primary">
            {pub.title}
          </Link>{" "}
          · {pub.publisher} · {pub.year}
        </p>
      )}
      <div className="mt-16 border-t border-border pt-8">
        <Link to="/poesia" className="text-link">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Volver al índice
        </Link>
      </div>
    </article>
  );
}
