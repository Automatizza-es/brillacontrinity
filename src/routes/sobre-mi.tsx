import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { PageIntro, Pending, Section } from "@/components/site/PageIntro";

export const Route = createFileRoute("/sobre-mi")({
  head: () => pageMeta("Sobre mí", "Conoce a Trinidad López, Trinity: numeróloga, coach y poeta."),
  component: () => (
    <>
      <PageIntro eyebrow="Sobre mí" title={<>Trinidad López, <span className="italic text-primary">Trinity</span></>} />
      <Section className="grid gap-8 md:grid-cols-2">
        <Pending label="Fotografía de Trinity" />
        <Pending label="Biografía">Trayectoria personal y profesional, redactada por Trinity.</Pending>
      </Section>
    </>
  ),
});
