import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { pageMeta } from "@/lib/seo";
import { PageIntro, Section } from "@/components/site/PageIntro";
import { Signature } from "@/components/site/Signature";

export const Route = createFileRoute("/conoce-tu-diamante")({
  head: () =>
    pageMeta(
      "Conoce tu Diamante",
      "Descubre tus dones a través de tu Diamante: una sesión individual online de numerología como herramienta simbólica de autoconocimiento.",
    ),
  component: ConoceTuDiamante,
});

const RESERVA_URL =
  "mailto:trinilopezregalon@gmail.com?subject=Reserva%20sesi%C3%B3n%20de%20Numerolog%C3%ADa";
const VIDEO_URL = "https://drive.google.com/file/d/1GZf_OCYvx3RnR55Fv932T05xbClVXaZ-/view?ts=6a93cf69";

const facetas = [
  {
    title: "Tu Esencia",
    text: "Conocerás las cualidades y dones que forman parte de tu naturaleza y aquello que tienes potencial para desarrollar.",
  },
  {
    title: "Tu Camino de Vida",
    text: "Exploraremos los aprendizajes asociados a esa especial energía que has venido a experimentar a lo largo de tu vida.",
  },
  {
    title: "Tus Dones",
    text: "Descubrirás capacidades que puedes desarrollar y compartir con los demás en las diferentes etapas de tu recorrido.",
  },
  {
    title: "Tus Desafíos",
    text: "Observaremos aquellos aspectos que pueden suponerte un reto y cómo convertirlos en recursos.",
  },
  {
    title: "Tu Propósito de Vida",
    text: "Exploraremos la dirección hacia la que apunta tu Diamante y las claves para comprender tu camino.",
  },
  {
    title: "Tu Año espiral o emocional",
    text: "Este dato te arrojará luz sobre si estás en un momento propicio para iniciar nuevos proyectos, para desarrollarlos, o más bien para ir cerrando algunos ya existentes.",
  },
];

const condiciones = [
  { label: "Sesión", value: "Individual" },
  { label: "Modalidad", value: "Online" },
  { label: "Duración", value: "60 minutos" },
  { label: "Precio", value: "38 €" },
];

const paraQuien = [
  "conocerte mejor",
  "descubrir tus dones y capacidades",
  "comprender determinados patrones de tu vida",
  "conocer las etapas de tu Camino de Vida",
  "observar tus desafíos desde otra perspectiva",
  "profundizar en tu propósito",
  "o simplemente tienes curiosidad por tus números",
];

function ReservaButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={RESERVA_URL}
      className={`inline-flex items-center rounded-full bg-primary px-7 py-3 text-sm tracking-wide text-primary-foreground transition-opacity hover:opacity-90 ${className}`}
    >
      Reservar mi sesión
    </a>
  );
}

function ConoceTuDiamante() {
  return (
    <>
      {/* Presentación */}
      <PageIntro eyebrow="Sesiones · Numerología" title="Conoce tu Diamante">
        <p className="font-serif text-2xl leading-snug text-foreground/85">
          Descubre tus dones a través de tu Diamante.
        </p>
        <p className="mt-4">
          Tu fecha de nacimiento contiene mucha más información de la que imaginas. Conoce tus números. Comprende tu
          camino. Descubre tus dones.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          <ReservaButton />
          <span className="text-sm tracking-wide text-muted-foreground">
            Sesión individual online · 60 minutos · 38 €
          </span>
        </div>
      </PageIntro>

      {/* ¿Qué es tu Diamante? */}
      <Section>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="eyebrow">El concepto</p>
            <h2 className="mt-5 text-4xl leading-tight sm:text-5xl">¿Qué es tu Diamante?</h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-foreground/80 md:col-span-6 md:col-start-7">
            <p>
              Tu Diamante es el mapa que reúne los diferentes números obtenidos a partir de tu fecha de nacimiento.
            </p>
            <p>
              Cada uno representa una faceta de ti y aporta información sobre tus cualidades, tus aprendizajes, tus
              desafíos y las distintas etapas de tu vida. Al unirlos podemos obtener una visión más amplia de tu
              recorrido.
            </p>
            <p className="border-l-2 border-mist pl-6 font-serif text-xl italic leading-snug text-foreground/85">
              La Numerología utiliza los números como un lenguaje simbólico de autoconocimiento. No pretende predecir
              tu futuro: te ofrece una nueva perspectiva desde la que observarte y comprender tu propia experiencia.
            </p>
          </div>
        </div>
      </Section>

      {/* ¿Qué descubrirás en tu sesión? */}
      <Section>
        <p className="eyebrow">Seis facetas de tu Diamante</p>
        <h2 className="mt-5 max-w-2xl text-4xl leading-tight sm:text-5xl">¿Qué descubrirás en tu sesión?</h2>
        <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {facetas.map((f) => (
            <div key={f.title} className="border-t border-border pt-6">
              <h3 className="font-serif text-2xl">{f.title}</h3>
              <p className="mt-3 leading-relaxed text-foreground/75">{f.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Hemos venido a brillar */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:px-10 lg:py-28">
          <p className="eyebrow">Hemos venido a brillar</p>
          <div className="mt-8 space-y-6 text-lg leading-relaxed text-foreground/80">
            <p>
              Cada Diamante tiene diferentes facetas. Algunas nos resultan fáciles de reconocer. Otras necesitan
              tiempo, experiencias y aprendizajes para poder expresarse plenamente.
            </p>
            <p>
              Conocer tus números puede ayudarte a observar tu historia desde otra perspectiva, reconocer recursos que
              ya tienes y comprender mejor determinados patrones de tu vida.
            </p>
            <p className="font-serif text-2xl italic leading-snug text-foreground">
              Conocer tu Diamante es conocerte un poco más a ti.
            </p>
          </div>
        </div>
      </section>

      {/* ¿Cómo es la sesión? */}
      <Section>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="eyebrow">La sesión</p>
            <h2 className="mt-5 text-4xl leading-tight sm:text-5xl">¿Cómo es la sesión?</h2>
            <ul className="mt-10 max-w-xs divide-y divide-border border-y border-border">
              {condiciones.map((c) => (
                <li key={c.label} className="flex items-baseline justify-between gap-6 py-3">
                  <span className="eyebrow">{c.label}</span>
                  <span className="font-serif text-xl">{c.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-foreground/80 md:col-span-6 md:col-start-7">
            <p>
              La sesión se realiza online, para que puedas hacerla cómodamente desde cualquier lugar. Iremos
              recorriendo las distintas partes de tu Diamante y podrás plantear las preguntas que vayan surgiendo.
            </p>
            <p>
              Para preparar tu sesión necesito tu fecha de nacimiento. Con ella calcularé previamente los números que
              forman tu Diamante para dedicar el tiempo a interpretarlos y relacionarlos con tu momento vital.
            </p>
            <p className="text-base">
              <a
                href={VIDEO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link"
              >
                Ver vídeo de presentación <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </p>
          </div>
        </div>
      </Section>

      {/* ¿Para quién puede ser interesante? */}
      <Section>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="eyebrow">Para ti si…</p>
            <h2 className="mt-5 text-4xl leading-tight sm:text-5xl">¿Para quién puede ser interesante?</h2>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <p className="text-lg leading-relaxed text-foreground/80">Esta sesión puede ayudarte si quieres:</p>
            <ul className="mt-6 space-y-3">
              {paraQuien.map((item) => (
                <li key={item} className="flex items-baseline gap-4 leading-relaxed text-foreground/80">
                  <span className="mt-2 block h-px w-5 shrink-0 bg-rose" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 font-serif text-xl italic text-foreground/85">
              No necesitas tener conocimientos previos de Numerología.
            </p>
          </div>
        </div>
      </Section>

      {/* Reserva tu sesión */}
      <section className="mx-auto max-w-5xl border-t border-border px-6 py-24 text-center sm:px-10 lg:py-32">
        <p className="eyebrow">Regálate tu Diamante</p>
        <p className="mt-8 font-serif text-[clamp(1.8rem,4.5vw,3rem)] leading-[1.25]">
          Tu fecha de nacimiento contiene tus números. Tus números forman tu Diamante.{" "}
          <span className="italic text-primary">Y cada una de sus facetas tiene algo que mostrarte.</span>
        </p>
        <p className="mt-6 font-serif text-2xl italic text-foreground/85">Hemos venido a brillar.</p>
        <div className="mt-10 flex flex-col items-center gap-4">
          <ReservaButton />
          <span className="text-sm tracking-wide text-muted-foreground">
            38 € · 60 min · Sesión individual online · Indícame tu fecha de nacimiento al reservar
          </span>
        </div>
        <div className="mt-14 flex justify-center">
          <Signature size="sm" />
        </div>
      </section>
    </>
  );
}
