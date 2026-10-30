import { CONTACT_MAILTO } from "@/lib/contact";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { pageMeta } from "@/lib/seo";
import { Section } from "@/components/site/PageIntro";

export const Route = createFileRoute("/sobre-mi")({
  head: () =>
    pageMeta(
      "Sobre mí",
      "Soy Trinidad López, Trinity. Numerología, coaching y escritura como caminos para conocernos y vivir desde nuestra propia esencia.",
    ),
  component: SobreMi,
});

function SobreMi() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-12 sm:px-10 lg:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-12">
          <div className="fade-up md:col-span-7">
            <p className="eyebrow">Sobre mí</p>
            <h1 className="mt-6 text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Soy Trinidad López, <span className="italic text-primary">Trinity.</span>
            </h1>
            <p className="mt-8 max-w-xl font-serif text-2xl leading-snug text-foreground/85 sm:text-[1.7rem]">
              Creo que conocernos es uno de los caminos más importantes que podemos recorrer.
            </p>
            <div className="mt-8 max-w-xl space-y-5 text-lg leading-relaxed text-foreground/80">
              <p>
                Aprender a escucharnos, aceptar nuestras contradicciones y dejar de intentar ser lo que los demás
                esperan de nosotros.
              </p>
              <p>
                A lo largo de mi propio camino he descubierto diferentes maneras de acercarme a ese conocimiento: la
                numerología, el coaching y la escritura.
              </p>
              <p>
                Cada una me aporta algo distinto, pero todas nacen de una misma inquietud: comprender mejor quiénes
                somos y aprender a vivir desde nuestra propia esencia.
              </p>
            </div>
          </div>
          <div className="fade-up md:col-span-5">
            <img
              src="/images/trinity-retrato.jpeg"
              alt="Retrato de Trinidad López, Trinity, sonriendo"
              width={1122}
              height={1402}
              className="mx-auto w-full max-w-sm md:max-w-md"
            />
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className="text-4xl leading-tight sm:text-5xl">
              Conocerme <span className="italic text-primary">para ser.</span>
            </h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-foreground/80 md:col-span-6 md:col-start-7">
            <p>
              A través de Conoce tu Diamante, comparto la numerología como una herramienta simbólica para reflexionar
              sobre nuestra personalidad, nuestros dones y los desafíos que encontramos en la vida.
            </p>
            <p>
              Desde el coaching, acompaño a quienes desean escucharse, reconocer aquello que les limita y encontrar sus
              propias respuestas.
            </p>
            <p>
              Y a través de la poesía, doy voz a emociones, pensamientos y experiencias que forman parte de mi manera de
              entender la vida.
            </p>
            <div className="flex flex-wrap gap-x-10 gap-y-4 pt-2 text-base">
              <Link to="/conoce-tu-diamante" className="text-link">
                Conoce tu Diamante <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link to="/coaching" className="text-link">
                Coaching <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link to="/poesia" className="text-link">
                Mi poesía <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <h2 className="text-4xl leading-tight sm:text-5xl">
              Escribir también es <span className="italic text-primary">descubrirme.</span>
            </h2>
            <div className="mt-8 space-y-6 text-lg leading-relaxed text-foreground/80">
              <p>
                Escribo sobre lo que siento, sobre lo que aprendo y sobre todas esas veces en las que nos perdemos
                intentando encajar.
              </p>
              <p>
                Mis poemas hablan de aceptación, libertad, miedos, contradicciones y de la importancia de permitirnos
                ser quienes somos.
              </p>
              <p>
                Cuatro de ellos forman parte de la antología <em>Cuentos y poesía</em>, publicada por Editorial Rubin
                en Argentina en 2026.
              </p>
            </div>
          </div>
          <figure className="flex flex-col justify-center md:col-span-5 md:col-start-8">
            <blockquote className="font-serif text-3xl italic leading-snug text-foreground sm:text-4xl">
              «Yo soy todo eso y mi error
              <br />
              es querer no serlo»
            </blockquote>
            <figcaption className="mt-6 text-sm tracking-wide text-muted-foreground">
              — Trinity, <em>Yo soy agua</em>
            </figcaption>
            <p className="mt-10 text-base">
              <Link to="/poesia" className="text-link">
                Descubrir mis poemas <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </p>
          </figure>
        </div>
      </Section>

      <section className="mx-auto max-w-4xl border-t border-border px-6 py-24 text-center sm:px-10 lg:py-28">
        <h2 className="text-4xl leading-tight sm:text-5xl">
          Atrévete a <span className="italic text-primary">brillar.</span>
        </h2>
        <div className="mx-auto mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-foreground/80">
          <p>Para mí, brillar no significa ser perfecta ni convertirse en alguien diferente.</p>
          <p>
            Significa reconocer nuestra propia luz, aceptar también nuestras sombras y atrevernos a mostrarnos tal
            como somos.
          </p>
        </div>
        <p className="mt-10 font-serif text-3xl sm:text-4xl">Conocerte. Ser. Brillar.</p>
        <p className="mt-6 font-script text-5xl leading-none text-rose">Trinity</p>
        <p className="mt-10 text-base">
          <a href={CONTACT_MAILTO} className="text-link">
            Hablemos <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </p>
      </section>
    </>
  );
}
