import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { Section } from "@/components/site/PageIntro";
import { Signature } from "@/components/site/Signature";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/coaching")({
  head: () =>
    pageMeta(
      "Coaching personal",
      "Un espacio para escucharte y volver a ti. Sesión individual de coaching con Trinity: 60 minutos, 50 €.",
    ),
  component: Coaching,
});

const areas = [
  {
    title: "Escucharte",
    text: "Dedicarte tiempo para reconocer lo que sientes, lo que deseas y aquello que necesitas en este momento de tu vida.",
  },
  {
    title: "Reconocer lo que te limita",
    text: "Explorar las creencias, los miedos y las expectativas que pueden estar condicionando tus decisiones.",
  },
  {
    title: "Encontrar tu propio camino",
    text: "Identificar tus prioridades, explorar alternativas y avanzar con decisiones más conscientes y coherentes contigo.",
  },
  {
    title: "Permitirte ser",
    text: "Dejar espacio para aceptarte con tus fortalezas, contradicciones y posibilidades, sin la exigencia constante de tener que ser mejor.",
  },
];

function ContactButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Link
      to="/contacto"
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base tracking-wide text-primary-foreground transition-opacity hover:opacity-90",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function Coaching() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-12 sm:px-10 lg:pt-20">
        <p className="eyebrow fade-up">Coaching personal</p>
        <h1 className="fade-up mt-6 max-w-4xl text-5xl leading-[1.04] sm:text-7xl">
          Un espacio para escucharte. <span className="italic text-primary">Y volver a ti.</span>
        </h1>
        <div className="fade-up mt-10 max-w-2xl space-y-5 text-lg leading-relaxed text-foreground/80">
          <p>
            A veces nos acostumbramos tanto a cumplir expectativas, atender a los demás y seguir adelante que dejamos de
            preguntarnos qué necesitamos realmente.
          </p>
          <p>
            Quizás sientes que ha llegado el momento de cambiar algo, pero no sabes por dónde empezar. O quizás
            simplemente necesitas detenerte, escucharte y mirar tu vida desde otra perspectiva.
          </p>
          <p className="font-serif text-2xl leading-snug text-foreground">El coaching puede ofrecerte ese espacio.</p>
          <p>
            Un acompañamiento para reflexionar, hacerte nuevas preguntas y encontrar tus propias respuestas, sin
            exigirte ser alguien diferente.
          </p>
        </div>
        <div className="fade-up mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <ContactButton>Reserva tu sesión</ContactButton>
          <p className="font-serif text-xl text-foreground/85">Sesión individual · 60 minutos · 50 €</p>
        </div>
      </section>

      <Section>
        <div className="grid gap-10 md:grid-cols-12">
          <h2 className="text-4xl leading-tight sm:text-5xl md:col-span-5">
            No tienes que tener <span className="italic text-primary">todas las respuestas.</span>
          </h2>
          <div className="max-w-2xl space-y-6 text-lg leading-relaxed text-foreground/80 md:col-span-6 md:col-start-7">
            <p>
              Hay momentos en los que necesitamos parar y preguntarnos si estamos viviendo como queremos o como creemos
              que deberíamos hacerlo.
            </p>
            <p>
              A través de la conversación, la reflexión y la escucha, podemos explorar aquello que nos preocupa,
              identificar lo que nos limita y descubrir otras maneras de afrontar nuestras decisiones.
            </p>
            <p className="border-l-2 border-mist pl-6 font-serif text-xl italic leading-snug text-foreground/85">
              No se trata de que alguien te diga qué camino tomar, sino de encontrar mayor claridad para elegir el tuyo.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <h2 className="max-w-2xl text-4xl leading-tight sm:text-5xl">¿En qué puede ayudarte el coaching?</h2>
        <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {areas.map((a) => (
            <div key={a.title} className="border-t border-border pt-6">
              <h3 className="font-serif text-2xl sm:text-3xl">{a.title}</h3>
              <p className="mt-3 text-lg leading-relaxed text-foreground/75">{a.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:px-10 lg:py-24">
          <h2 className="text-4xl leading-tight sm:text-5xl">
            Un acompañamiento <span className="italic text-primary">a tu ritmo.</span>
          </h2>
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-foreground/80">
            <p>Cada persona llega con una historia, unas circunstancias y unas preguntas diferentes.</p>
            <p>
              Por eso, el punto de partida es escucharte, comprender qué deseas trabajar y explorar juntas qué pasos
              pueden tener sentido para ti.
            </p>
            <p className="text-base text-muted-foreground">
              El coaching es un proceso de acompañamiento orientado a la reflexión y a la acción. No es una terapia
              psicológica ni sustituye la atención de profesionales sanitarios cuando esta es necesaria.
            </p>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-12 md:grid-cols-12 md:items-center">
          <div className="md:col-span-6">
            <p className="eyebrow">Tu sesión de coaching</p>
            <h2 className="mt-5 text-4xl leading-tight sm:text-5xl">
              Tu espacio, <span className="italic text-primary">tu momento.</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-foreground/80">
              Una sesión para detenerte, escucharte y dedicar tiempo a aquello que hoy necesitas trabajar.
            </p>
          </div>
          <div className="border border-border px-8 py-8 sm:px-10 md:col-span-5 md:col-start-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="eyebrow">Duración</p>
                <p className="mt-3 font-serif text-3xl leading-none sm:text-4xl">60 min</p>
              </div>
              <div className="text-right">
                <p className="eyebrow">Precio</p>
                <p className="mt-3 font-serif text-3xl leading-none sm:text-4xl">50 €</p>
              </div>
            </div>
            <p className="mt-5 text-base text-muted-foreground">
              Sesión individual · Modalidad pendiente de confirmar
            </p>
            <ContactButton className="mt-8 w-full">Reservar mi sesión de coaching</ContactButton>
          </div>
        </div>
      </Section>

      <section className="mx-auto max-w-4xl border-t border-border px-6 py-24 text-center sm:px-10 lg:py-28">
        <h2 className="text-4xl leading-tight sm:text-5xl">
          Conocerte. Aceptarte. <span className="italic text-primary">Avanzar.</span>
        </h2>
        <div className="mx-auto mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-foreground/80">
          <p>No necesitas tenerlo todo claro para empezar a escucharte.</p>
          <p>A veces, lo primero es darte permiso para hacerte preguntas que llevas tiempo posponiendo.</p>
        </div>
        <ContactButton className="mt-10">¿Hablamos?</ContactButton>
        <div className="mt-14 flex justify-center">
          <Signature size="sm" />
        </div>
      </section>
    </>
  );
}
