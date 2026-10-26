import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { PageIntro, Pending, Section } from "@/components/site/PageIntro";
import { publications } from "@/content/publications";

export const Route = createFileRoute("/publicaciones")({
  head: () => pageMeta("Publicaciones", "Libros y obras colectivas en las que participa Trinity como autora."),
  component: () => (
    <>
      <PageIntro eyebrow="Publicaciones" title="Mis palabras, también en papel." />
      {publications.map((b) => (
        <Section key={b.slug} className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            {b.coverUrl ? (
              <img src={b.coverUrl} alt={`Portada de ${b.title}`} className="w-full max-w-[260px]" loading="lazy" />
            ) : (
              <div className="flex aspect-[2/3] max-w-[240px] items-center justify-center border border-dashed border-mist bg-mist-soft/50 p-6 text-center">
                <span className="eyebrow text-mist">Portada · pendiente</span>
              </div>
            )}
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <p className="eyebrow">
              {b.kind} · {b.publisher} · {b.country} · {b.year}
            </p>
            <h2 className="mt-4 text-4xl italic sm:text-5xl">{b.title}</h2>
            {b.poems && (
              <>
                <p className="mt-8 text-muted-foreground">Poemas incluidos</p>
                <ul className="mt-3 max-w-md divide-y divide-border border-y border-border">
                  {b.poems.map((t) => (
                    <li key={t} className="py-3 font-serif text-xl italic">{t}</li>
                  ))}
                </ul>
              </>
            )}
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {b.synopsis ? <p>{b.synopsis}</p> : <Pending label="Sinopsis" />}
              {b.purchaseLinks?.length ? (
                <ul>{b.purchaseLinks.map((l) => <li key={l.url}><a className="text-link" href={l.url}>{l.label}</a></li>)}</ul>
              ) : (
                <Pending label="Dónde adquirirlo" />
              )}
            </div>
          </div>
        </Section>
      ))}
    </>
  ),
});
