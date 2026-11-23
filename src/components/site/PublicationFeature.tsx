import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Publication } from "@/content/publications";
import type { Poem } from "@/content/poems";
import { Section } from "./PageIntro";

export function PublicationFeature({
  publication: b,
  poems,
}: {
  publication: Publication;
  poems: Poem[];
}) {
  // Keep the existing database URL valid before deployment; this release renders
  // the approved derivatives for the anthology without another remote write.
  const responsiveCover =
    b.coverUrl === "/images/voces-entretejidas-960.webp" ||
    (b.slug === "cuentos-y-poesia" && b.coverUrl === "/images/portada-cuentos-y-poesia.jpeg");
  const coverSrc = responsiveCover ? "/images/voces-entretejidas-960.webp" : b.coverUrl;
  return (
    <Section className="grid items-start gap-10 md:grid-cols-12 lg:gap-12">
      <div className="md:col-span-5">
        {b.coverUrl && (
          <img
            src={coverSrc}
            srcSet={
              responsiveCover
                ? "/images/voces-entretejidas-480.webp 480w, /images/voces-entretejidas-960.webp 960w"
                : undefined
            }
            sizes={responsiveCover ? "(min-width: 768px) 40vw, 90vw" : undefined}
            width={responsiveCover ? 960 : undefined}
            height={responsiveCover ? 1472 : undefined}
            alt={`Portada de ${b.title}`}
            className="mx-auto w-full max-w-[420px]"
            loading="eager"
            decoding="async"
          />
        )}
      </div>
      <div className="min-w-0 md:col-span-7">
        <p className="eyebrow">{b.kind}</p>
        <h2 className="mt-4 text-4xl leading-tight italic sm:text-5xl">{b.title}</h2>
        <p className="mt-5 font-serif text-xl text-muted-foreground">
          {b.publisher} · {b.year}
        </p>
        {b.synopsis && (
          <div className="mt-7 space-y-4 leading-relaxed text-muted-foreground">
            {b.synopsis.split(/\n\s*\n/).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}
        {b.role && (
          <p className="mt-7 border-l-2 border-primary/40 pl-5 font-serif text-xl leading-relaxed">
            {b.role}
          </p>
        )}
        {!!b.poemSlugs?.length && (
          <div className="mt-10">
            <h3 className="eyebrow">Lee los poemas de Trinity</h3>
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {b.poemSlugs.map((slug) => {
                const poem = poems.find((p) => p.slug === slug);
                return poem ? (
                  <li key={slug}>
                    <Link
                      to="/poesia/$slug"
                      params={{ slug }}
                      className="group flex min-h-12 items-center justify-between gap-4 py-3"
                    >
                      <span className="font-serif text-xl italic group-hover:text-primary">
                        {poem.title}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    </Link>
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}
        {!!b.purchaseLinks?.length && (
          <div className="mt-10">
            <h3 className="eyebrow">Dónde conseguir el libro</h3>
            <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
              {b.purchaseLinks.map((link) => (
                <li key={link.url}>
                  <a className="text-link inline-flex min-h-11 items-center gap-3" href={link.url}>
                    {link.label}
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {(b.place || b.isbn) && (
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
            {b.place && (
              <div>
                <dt className="inline">Lugar: </dt>
                <dd className="inline">{b.place}</dd>
              </div>
            )}
            {b.isbn && (
              <div>
                <dt className="inline">ISBN: </dt>
                <dd className="inline">{b.isbn}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </Section>
  );
}
