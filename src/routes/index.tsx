import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import heroLuz from "@/assets/hero-luz.jpg";
import areaDiamante from "@/assets/area-diamante.jpg";
import areaCoaching from "@/assets/area-coaching.jpg";
import areaPoesia from "@/assets/area-poesia.jpg";
import { pageMeta } from "@/lib/seo";
import { Signature } from "@/components/site/Signature";
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
    text: "Descubre tu esencia, tus dones y tu camino a través de la numerología.",
    cta: "Conocer la sesión",
    to: "/conoce-tu-diamante" as const,
    img: areaDiamante,
    alt: "Luz atravesando un cristal sobre papel claro",
  },
  {
    n: "02",
    title: "Coaching",
    text: "Un espacio para escucharte, cuestionar lo que te limita y avanzar desde lo que eres.",
    cta: "Descubrir el acompañamiento",
    to: "/coaching" as const,
    img: areaCoaching,
    alt: "Estancia luminosa con un arco y luz de mañana",
  },
  {
    n: "03",
    title: "Poesía",
    text: "Palabras que nacen de la experiencia, las emociones y la libertad de ser.",
    cta: "Leer mi poesía",
    to: "/poesia" as const,
    img: areaPoesia,
    alt: "Libro abierto junto a una hoja escrita a mano",
  },
];

function Index() {
  const book = publications[0]!;
  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-12 pt-6 sm:px-10 md:grid-cols-12 md:gap-8 md:pb-14 md:pt-8">
        <div className="md:col-span-6 lg:col-span-6">
          <p className="eyebrow fade-up flex items-center gap-3">
            <span className="h-px w-8 bg-mist" aria-hidden />
            Autoconocimiento · Coaching · Poesía
          </p>
          <h1 className="fade-up mt-6 text-[clamp(3.4rem,9vw,7rem)] leading-[0.92] tracking-[-0.02em]">
            Atrévete
            <br />
            <span className="italic">a brillar</span>
            <span className="text-rose">.</span>
          </h1>
          <p className="fade-up mt-6 max-w-md font-serif text-2xl leading-snug text-foreground/85">
            Un espacio para conocerte, aceptarte tal como eres y dar voz a tu propia luz.
          </p>
          <div className="fade-up mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/conoce-tu-diamante"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
            >
              Conoce mis sesiones
            </Link>
            <Link
              to="/poesia"
              className="inline-flex items-center gap-2 rounded-full border border-foreground/30 px-6 py-3 text-sm tracking-wide transition-colors hover:border-mist hover:bg-mist-soft"
            >
              Leer mi poesía
            </Link>
          </div>
        </div>
        <figure className="fade-up relative md:col-span-6 lg:col-span-5 lg:col-start-8">
          <img
            src={heroLuz}
            alt="Luz de mañana sobre una mesa con un libro y una espiga en un vaso"
            width={1024}
            height={1152}
            className="aspect-[4/3] w-full object-cover md:aspect-[5/4]"
          />
          <figcaption className="absolute bottom-0 left-0 bg-background/90 px-5 py-4 font-serif text-lg italic leading-snug">
            Hay una luz en ti
            <br />
            que también es palabra.
            <span className="mt-3 block h-px w-8 bg-rose" aria-hidden />
          </figcaption>
        </figure>
      </section>

      {/* Tres caminos */}
      <section aria-label="Tres caminos" className="mx-auto max-w-7xl border-t border-border px-6 sm:px-10">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 md:divide-x md:divide-border">
          {paths.map((p, i) => (
            <article
              key={p.n}
              className={`flex flex-col py-10 sm:px-4 md:px-8 lg:px-10 ${i > 0 ? "border-t border-border sm:border-t-0" : ""} ${i === 2 ? "sm:col-span-2 sm:border-t md:col-span-1 md:border-t-0" : ""}`}
            >
              <img
                src={p.img}
                alt={p.alt}
                width={992}
                height={672}
                loading="lazy"
                className="aspect-[16/9] w-full object-cover"
              />
              <div className="mt-6 flex items-baseline gap-4">
                <span className={`font-serif text-lg ${i === 1 ? "text-mist" : "text-rose"}`}>{p.n}</span>
                <h2 className="text-3xl lg:text-[2.2rem]">{p.title}</h2>
              </div>
              <p className="mt-3 flex-1 leading-relaxed text-foreground/75">{p.text}</p>
              <Link to={p.to} className="text-link mt-6 self-start">
                {p.cta} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Presentación */}
      <section className="mx-auto max-w-7xl border-t border-border px-6 py-20 sm:px-10 lg:py-28">
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

