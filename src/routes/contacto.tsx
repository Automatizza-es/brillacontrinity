import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { PageIntro, Section } from "@/components/site/PageIntro";
import { CONTACT_EMAIL, CONTACT_MAILTO, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/contact";

export const Route = createFileRoute("/contacto")({
  head: () => pageMeta("Contacto", "Reserva tu sesión o escribe a Trinity."),
  component: () => (
    <>
      <PageIntro eyebrow="Contacto" title={<>Hablemos<span className="text-primary">.</span></>}>
        Para reservar una sesión de Conoce tu Diamante o de coaching, o para cualquier consulta sobre su poesía.
      </PageIntro>
      <Section className="grid gap-10 md:grid-cols-2">
        <div>
          <p className="eyebrow">Email</p>
          <a href={CONTACT_MAILTO} className="mt-3 block break-all font-serif text-2xl hover:text-primary sm:text-3xl">{CONTACT_EMAIL}</a>
        </div>
        <div>
          <p className="eyebrow">Instagram</p>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="mt-3 block font-serif text-2xl hover:text-primary sm:text-3xl">@{INSTAGRAM_HANDLE}</a>
        </div>
        <div className="md:col-span-2">
          <a href={CONTACT_MAILTO} className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base tracking-wide text-primary-foreground transition-opacity hover:opacity-90">Escríbeme</a>
        </div>
      </Section>
    </>
  ),
});
