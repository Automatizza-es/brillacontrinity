export type Publication = {
  slug: string;
  title: string;
  publisher: string;
  country?: string;
  year: number;
  kind: string;
  synopsis?: string;
  poems?: string[];
  coverUrl?: string;
  purchaseLinks?: { label: string; url: string }[];
};

export const publications: Publication[] = [
  {
    slug: "cuentos-y-poesia",
    title: "Cuentos y poesía",
    publisher: "Editorial Rubin",
    country: "Argentina",
    year: 2026,
    kind: "Obra colectiva",
    poems: ["Círculo de mujeres", "Yo soy agua", "Me pierdo…", "Desaprendiendo"],
  },
];
