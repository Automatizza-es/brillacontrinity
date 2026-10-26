import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { pageMeta } from "@/lib/seo";
import { Section } from "@/components/site/PageIntro";
import retrato from "@/assets/trinity-retrato.png.asset.json";

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
              src={retrato.url}
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
            <p className="text-base">
              <Link to="/conoce-tu-diamante" className="text-link">
                Conoce tu Diamante <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
