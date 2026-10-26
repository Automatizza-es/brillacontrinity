/**
 * Books and publications. Add a book by appending an entry.
 * `poemSlugs` link to entries in src/content/poems.ts (poems are never duplicated here).
 * Never invent ISBN, synopsis or purchase links — leave them out until supplied.
 */
export type Publication = {
  slug: string;
  title: string;
  publisher: string;
  place?: string;
  year: number;
  kind: string;
  role?: string;
  synopsis?: string;
  poemSlugs?: string[];
  coverUrl?: string;
  isbn?: string;
  purchaseLinks?: { label: string; url: string }[];
};

export const publications: Publication[] = [
  {
    slug: "cuentos-y-poesia",
    title: "Cuentos y poesía",
    publisher: "Editorial Rubin",
    place: "San Luis, Argentina",
    year: 2026,
    kind: "Antología colectiva",
    role: "Autora participante: Trinidad López (Trinity)",
    poemSlugs: ["circulo-de-mujeres", "yo-soy-agua", "me-pierdo", "desaprendiendo"],
  },
];

export const getPublication = (slug: string) => publications.find((p) => p.slug === slug);
