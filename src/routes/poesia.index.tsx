import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { pageMeta } from "@/lib/seo";
import { PageIntro, Section } from "@/components/site/PageIntro";
import { poems } from "@/content/poems";
import { getPublication } from "@/content/publications";

export const Route = createFileRoute("/poesia/")({
  head: () => pageMeta("Poesía", "Biblioteca de poemas de Trinity: palabras sobre aceptación, libertad y la importancia de ser quienes somos."),
  component: PoesiaIndex,
});

function PoesiaIndex() {
  return (
    <>
      <PageIntro eyebrow="Poesía" title={<>Palabras que <span className="italic text-primary">respiran</span></>} />
      <Section>
        <ol className="divide-y divide-border border-b border-border">
          {poems.map((p) => {
            const pub = p.publication ? getPublication(p.publication) : undefined;
            return (
              <li key={p.slug}>
                <Link
                  to="/poesia/$slug"
                  params={{ slug: p.slug }}
                  className="group grid gap-3 py-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-10"
                >
                  <div className="min-w-0">
                    <h2 className="text-3xl italic transition-colors group-hover:text-primary sm:text-4xl">{p.title}</h2>
                    {p.description && <p className="mt-2 text-muted-foreground">{p.description}</p>}
                    <p className="eyebrow mt-3">
                      {pub ? (
                        <span className="text-mist">
                          Antología · {pub.title}, {pub.year}
                        </span>
                      ) : (
                        "Inédito"
                      )}
                    </p>
                  </div>
                  <span className="text-link shrink-0">
                    Leer <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </Section>
    </>
  );
}
