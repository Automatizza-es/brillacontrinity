import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { PageIntro, Pending, Section } from "@/components/site/PageIntro";
import { poems } from "@/content/poems";

export const Route = createFileRoute("/poesia")({
  head: () => pageMeta("Poesía", "Poemas de Trinity: palabras nacidas de la experiencia y la búsqueda de autenticidad."),
  component: () => (
    <>
      <PageIntro eyebrow="Poesía" title={<>Palabras que <span className="italic text-primary">respiran</span></>} />
      {poems.map((p) => (
        <Section key={p.slug}>
          <article className="mx-auto max-w-2xl">
            <h2 className="text-3xl italic sm:text-4xl">{p.title}</h2>
            <p className="poem mt-10 text-2xl leading-[1.6] sm:text-[1.7rem]">{p.text}</p>
            {(p.excerpt || p.publication) && (
              <p className="eyebrow mt-10">
                {p.excerpt ? "Fragmento" : ""}
                {p.excerpt && p.publication ? " · " : ""}
                {p.publication}
              </p>
            )}
          </article>
        </Section>
      ))}
      <Section>
        <Pending label="Más poemas">Textos originales de Trinity, respetando saltos de línea y estrofas.</Pending>
      </Section>
    </>
  ),
});
