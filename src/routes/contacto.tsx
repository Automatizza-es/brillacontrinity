import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { PageIntro, Pending, Section } from "@/components/site/PageIntro";

export const Route = createFileRoute("/contacto")({
  head: () => pageMeta("Contacto", "Reserva tu sesión o escribe a Trinity."),
  component: () => (
    <>
      <PageIntro eyebrow="Contacto" title={<>Hablemos<span className="text-primary">.</span></>}>
        Para reservar una sesión de Conoce tu Diamante o de coaching, o para cualquier consulta sobre su poesía.
      </PageIntro>
      <Section className="grid gap-8 md:grid-cols-2">
        <Pending label="Email y teléfono de contacto" />
        <Pending label="Sistema de reserva">Formulario o enlace de reservas por definir.</Pending>
      </Section>
    </>
  ),
});
