/**
 * Poems. `text` keeps original line breaks, stanzas (blank lines) and spacing.
 * Only add texts supplied by Trinity.
 */
export type Poem = {
  slug: string;
  title: string;
  text: string;
  /** true when only an excerpt is published */
  excerpt?: boolean;
  publication?: string;
};

export const poems: Poem[] = [
  {
    slug: "yo-soy-agua",
    title: "Yo soy agua",
    text: "Yo soy todo eso y mi error\nes querer no serlo",
    excerpt: true,
    publication: "Cuentos y poesía (Editorial Rubin, 2026)",
  },
];
