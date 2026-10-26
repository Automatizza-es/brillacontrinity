import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import escritura from "@/assets/escritura.jpg";
import { pageMeta } from "@/lib/seo";
import { Signature } from "@/components/site/Signature";
import { Pending } from "@/components/site/PageIntro";
import { publications } from "@/content/publications";

export const Route = createFileRoute("/")({
  head: () =>
    pageMeta(
      "Atrévete a brillar",
      "Trinidad López, Trinity: numerología, coaching y poesía. Un espacio para conocerte, aceptarte y dar voz a tu propia luz.",
    ),
  component: Index,
});

const paths = [
  {
    n: "01",
    title: "Conoce tu Diamante",
    text: "Una mirada a tu mundo interior a través de la numerología. Una sesión individual para explorar tus dones, tus desafíos y diferentes aspectos de tu personalidad.",
    cta: "Descubrir la sesión",
    to: "/conoce-tu-diamante" as const,
  },
  {
    n: "02",
    title: "Coaching",
    text: "Un espacio de escucha y acompañamiento para reconocer lo que necesitas, cuestionar aquello que te limita y avanzar desde lo que eres.",
    cta: "Conocer el acompañamiento",
    to: "/coaching" as const,
  },
  {
    n: "03",
    title: "Poesía",
    text: "Palabras nacidas de la experiencia, las emociones y la búsqueda de una vida más auténtica. Una manera de compartir lo que a veces cuesta expresar.",
    cta: "Leer mis poemas",
    to: "/poesia" as const,
  },
];

function Index() {
  const book = publications[0];
  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-10 sm:px-10 md:grid-cols-12 md:gap-8 md:pt-16 lg:pb-32 lg:pt-24">
        <div className="md:col-span-7 lg:col-span-7">
          <p className="eyebrow fade-up">Autoconocimiento · Coaching · Poesía</p>
          <h1 className="fade-up mt-8 text-[clamp(3.6rem,13vw,9.5rem)] leading-[0.92] tracking-[-0.02em]">
            Atrévete
            <br />
            <span className="pl-[0.6em] italic md:pl-[0.9em]">a brillar.</span>
          </h1>
          <p className="fade-up mt-10 max-w-md font-serif text-2xl leading-snug text-foreground/85 sm:text-[1.7rem]">
            Un espacio para conocerte, aceptarte tal como eres y dar voz a tu propia luz.
          </p>
          <div className="fade-up mt-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
            <Link to="/conoce-tu-diamante" className="text-link text-foreground">
              Conoce mis sesiones <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link to="/poesia" className="text-link text-foreground">
              Leer mi poesía <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
        <figure className="fade-up md:col-span-4 md:col-start-9 md:mt-28 lg:col-span-3 lg:col-start-10 lg:mt-40">
          <img
            src={escritura}
            alt="Cuaderno abierto con versos manuscritos y una pluma, a la luz de una ventana"
            width={800}
            height={1040}
            className="aspect-[4/5] w-2/3 max-w-xs object-cover sm:w-1/2 md:w-full"
          />
          <figcaption className="mt-4 font-serif text-lg italic text-muted-foreground">
            Escribir para escucharse.
          </figcaption>
        </figure>
      </section>

      {/* Presentación */}
      <section className="mx-auto max-w-7xl border-t border-border px-6 py-20 sm:px-10 lg:py-32">
        <div className="grid gap-10 md:grid-cols-12">
          <h2 className="text-4xl leading-tight sm:text-5xl md:col-span-5 lg:text-6xl">
            Conocerte.
            <br />
            Ser.
            <br />
            <span className="italic text-primary">Brillar.</span>
          </h2>
          <div className="space-y-6 text-lg leading-relaxed text-foreground/80 md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-7">
            <p>
              A veces pasamos tanto tiempo intentando ser lo que se espera de nosotros que olvidamos escuchar quiénes
              somos realmente.
            </p>
            <p>
              Creo que cada persona tiene su propia manera de sentir, de vivir y de expresarse. Y que aprender a
              reconocernos, aceptarnos y mirar nuestra vida desde otra perspectiva puede abrirnos nuevos caminos.
            </p>
            <p>
              Soy Trinidad López, Trinity, y aquí comparto tres formas de explorar ese camino: la numerología, el
              acompañamiento personal y la poesía.
            </p>
          </div>
        </div>
      </section>

      {/* Tres caminos */}
      <section aria-label="Tres caminos" className="mx-auto max-w-7xl border-t border-border px-6 sm:px-10">
        <div className="grid md:grid-cols-3 md:divide-x md:divide-border">
          {paths.map((p, i) => (
            <article
              key={p.n}
              className={`flex flex-col py-14 md:px-8 md:py-20 lg:px-12 ${i > 0 ? "border-t border-border md:border-t-0" : ""} md:first:pl-0 md:last:pr-0`}
            >
              <span className="font-serif text-lg text-rose">{p.n}</span>
              <h3 className="mt-4 text-3xl lg:text-4xl">{p.title}</h3>
              <p className="mt-5 flex-1 leading-relaxed text-foreground/75">{p.text}</p>
              <Link to={p.to} className="text-link mt-10 self-start">
                {p.cta} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Poema */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 py-28 text-center sm:px-10 lg:py-44">
          <blockquote>
            <p className="poem text-[clamp(2.2rem,6vw,4.5rem)] italic leading-[1.15]">
              “Yo soy todo eso y mi error{"\n"}es querer no serlo”
            </p>
            <footer className="eyebrow mt-12">
              Trinity — <cite className="not-italic">Yo soy agua</cite>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Publicación */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:py-32">
        <div className="grid items-start gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="flex aspect-[2/3] max-w-[240px] items-center justify-center border border-dashed border-mist bg-mist-soft/50 p-6 text-center">
              <span className="eyebrow text-mist">Portada del libro · pendiente</span>
            </div>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <p className="eyebrow">Publicación</p>
            <h2 className="mt-5 text-4xl leading-tight sm:text-5xl">Mis palabras, también en papel.</h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/80">
              Cuatro de mis poemas forman parte de <em>{book.title}</em>, una obra colectiva publicada en{" "}
              {book.country} por {book.publisher} en {book.year}.
            </p>
            <ul className="mt-8 max-w-md divide-y divide-border border-y border-border">
              {book.poems?.map((t) => (
                <li key={t} className="py-3 font-serif text-xl italic">
                  {t}
                </li>
              ))}
            </ul>
            <Link to="/publicaciones" className="text-link mt-10">
              Descubrir la publicación <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="mx-auto max-w-5xl border-t border-border px-6 py-24 text-center sm:px-10 lg:py-36">
        <p className="text-[clamp(2rem,5vw,3.6rem)] font-serif leading-[1.2]">
          Quizás no se trate de ser alguien diferente.{" "}
          <span className="italic text-primary">Quizás se trate de permitirte ser tú.</span>
        </p>
        <div className="mt-12 flex justify-center">
          <Signature size="sm" />
        </div>
        <Link to="/contacto" className="text-link mt-10">
          Hablemos <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </>
  );
}

export { Pending };
