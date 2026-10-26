import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { PageIntro, Pending, Section } from "@/components/site/PageIntro";

export const Route = createFileRoute("/coaching")({
  head: () =>
    pageMeta("Coaching", "Acompañamiento personal para conocerte, aceptarte y vivir con mayor autenticidad."),
  component: () => (
    <>
      <PageIntro eyebrow="Sesiones · Coaching" title="Coaching">
        Un espacio de escucha y acompañamiento para reconocer lo que necesitas, cuestionar aquello que te limita y
        avanzar desde lo que eres.
      </PageIntro>
      <Section className="grid gap-8 md:grid-cols-2">
        <Pending label="Metodología" />
        <Pending label="Formación" />
        <Pending label="Modalidades" />
        <Pending label="Reservas" />
      </Section>
      <Section>
        <Link to="/contacto" className="text-link">Hablemos</Link>
      </Section>
    </>
  ),
});
