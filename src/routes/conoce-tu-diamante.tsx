import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { PageIntro, Pending, Section } from "@/components/site/PageIntro";

export const Route = createFileRoute("/conoce-tu-diamante")({
  head: () =>
    pageMeta(
      "Conoce tu Diamante",
      "Sesiones individuales de autoconocimiento a través de la numerología, entendida como herramienta simbólica.",
    ),
  component: () => (
    <>
      <PageIntro eyebrow="Sesiones · Numerología" title="Conoce tu Diamante">
        Una mirada a tu mundo interior a través de la numerología. Una sesión individual para explorar tus dones, tus
        desafíos y diferentes aspectos de tu personalidad.
      </PageIntro>
      <Section>
        <div className="max-w-2xl border-l-2 border-mist pl-6">
          <p className="eyebrow">Una nota importante</p>
          <p className="mt-3 font-serif text-2xl leading-snug">
            La numerología es una herramienta simbólica de autoconocimiento. No es un método científico ni una forma
            de predecir el futuro.
          </p>
        </div>
      </Section>
      <Section className="grid gap-8 md:grid-cols-3">
        <Pending label="Cómo es la sesión" />
        <Pending label="Duración y modalidad" />
        <Pending label="Precio y reserva" />
      </Section>
      <Section>
        <Link to="/contacto" className="text-link">Reserva tu sesión</Link>
      </Section>
    </>
  ),
});
