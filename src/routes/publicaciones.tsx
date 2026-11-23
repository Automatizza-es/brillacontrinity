import { createFileRoute } from "@tanstack/react-router";
import { PublicationFeature } from "@/components/site/PublicationFeature";
import { pageMeta } from "@/lib/seo";
import { PageIntro, Section } from "@/components/site/PageIntro";
import { loadPublicCatalog } from "@/lib/public-content/functions";
import { freshPublicContent } from "@/lib/public-content/route-options";
import { PublicContentError } from "@/components/site/PublicContentError";

export const Route = createFileRoute("/publicaciones")({
  ...freshPublicContent,
  loader: () => loadPublicCatalog(),
  errorComponent: () => <PublicContentError kind="publicaciones" />,
  head: ({ loaderData }) => {
    const metadata = pageMeta(
      loaderData?.publications[0]?.title ?? "Publicaciones",
      loaderData?.publications[0]
        ? `${loaderData.publications[0].title}, de ${loaderData.publications[0].publisher}. Una obra colectiva con la participación de Trinidad López (Trinity) como autora.`
        : "Libros y antologías en los que participa Trinidad López · Trinity como autora.",
    );
    return {
      meta: [...metadata.meta, ...(!loaderData ? [{ name: "robots", content: "noindex" }] : [])],
    };
  },
  component: Publicaciones,
});

function Publicaciones() {
  const { publications, poems } = Route.useLoaderData();
  return (
    <>
      <PageIntro eyebrow="Publicaciones" title="Mis palabras, también en papel." />
      {publications.length === 0 && (
        <Section>
          <p className="font-serif text-xl">Ahora no hay publicaciones disponibles.</p>
        </Section>
      )}
      {publications.map((publication) => (
        <PublicationFeature key={publication.slug} publication={publication} poems={poems} />
      ))}
    </>
  );
}
