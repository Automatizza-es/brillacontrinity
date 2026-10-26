import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { pageMeta } from "@/lib/seo";
import { PageIntro, Section } from "@/components/site/PageIntro";
import { publications } from "@/content/publications";
import { getPoem } from "@/content/poems";

export const Route = createFileRoute("/publicaciones")({
  head: () => pageMeta("Publicaciones", "Libros y antologías en los que participa Trinidad López · Trinity como autora."),
  component: Publicaciones,
});

function Publicaciones() {
  return (
    <>
      <PageIntro eyebrow="Publicaciones" title="Mis palabras, también en papel." />
      {publications.map((b) => (
        <Section key={b.slug} className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            {b.coverUrl ? (
              <img src={b.coverUrl} alt={`Portada de ${b.title}`} className="w-full max-w-[320px]" loading="lazy" />
            ) : null}
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <p className="eyebrow">{b.kind}</p>
            <h2 className="mt-4 text-4xl italic sm:text-5xl">{b.title}</h2>
            <dl className="mt-8 max-w-md divide-y divide-border border-y border-border">
              {[
                ["Editorial", b.publisher],
                ["Lugar", b.place],
                ["Año", String(b.year)],
                ...(b.isbn ? [["ISBN", b.isbn]] : []),
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-6 py-3">
                    <dt className="eyebrow">{k}</dt>
                    <dd className="font-serif text-lg">{v}</dd>
                  </div>
                ))}
            </dl>
            {b.role && <p className="mt-6 text-foreground/80">{b.role}</p>}
            {b.poemSlugs && (
              <>
                <p className="eyebrow mt-12">Poemas de Trinity incluidos</p>
                <ul className="mt-4 max-w-md divide-y divide-border border-y border-border">
                  {b.poemSlugs.map((s) => {
                    const poem = getPoem(s);
                    if (!poem) return null;
                    return (
                      <li key={s}>
                        <Link
                          to="/poesia/$slug"
                          params={{ slug: s }}
                          className="group flex items-center justify-between gap-4 py-3"
                        >
                          <span className="font-serif text-xl italic group-hover:text-primary">{poem.title}</span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-rose" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {b.synopsis ? <p>{b.synopsis}</p> : <div />}
              {b.purchaseLinks?.length ? (
                <ul>
                  {b.purchaseLinks.map((l) => (
                    <li key={l.url}>
                      <a className="text-link" href={l.url}>{l.label}</a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div>
                  <p className="eyebrow">Dónde adquirir el libro</p>
                  <p className="mt-3 font-serif text-xl">Próximamente</p>
                </div>
              )}
            </div>
          </div>
        </Section>
      ))}
    </>
  );
}
