import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicationFeature } from "@/components/site/PublicationFeature";
import { poems } from "@/content/poems";
import { publications } from "@/content/publications";
import proposal from "../../supabase/updates/voces-entretejidas.json";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    params,
    children,
    ...props
  }: {
    params: { slug: string };
    children: React.ReactNode;
  }) => (
    <a {...props} href={`/poesia/${params.slug}`}>
      {children}
    </a>
  ),
}));
afterEach(cleanup);
const publication = {
  ...publications[0]!,
  title: proposal.title,
  publisher: proposal.publisher,
  role: proposal.role,
  synopsis: proposal.synopsis,
  coverUrl: proposal.cover_url,
  purchaseLinks: proposal.purchase_links,
};

describe("Published anthology presentation", () => {
  it("preserves the four poem destinations and separates physical/ebook purchases", () => {
    render(<PublicationFeature publication={publication} poems={poems} />);
    for (const slug of publication.poemSlugs!) {
      const poem = poems.find((p) => p.slug === slug)!;
      expect(screen.getByRole("link", { name: poem.title })).toHaveAttribute(
        "href",
        `/poesia/${slug}`,
      );
    }
    for (const link of proposal.purchase_links)
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.url);
    expect(screen.queryByText(/Próximamente/)).not.toBeInTheDocument();
    expect(screen.getByText(/251 cuentos y poemas/)).toBeInTheDocument();
    expect(screen.getByText(/12 de noviembre de 2026/)).toBeInTheDocument();
    expect(screen.getByText(proposal.role)).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("width", "960");
  });
  it("does not link to poems absent from the published catalog", () => {
    render(
      <PublicationFeature
        publication={publication}
        poems={poems.filter((p) => p.slug !== "me-pierdo")}
      />,
    );
    expect(screen.queryByRole("link", { name: "Me pierdo…" })).not.toBeInTheDocument();
  });
  it("omits the purchase section when links have not been supplied", () => {
    render(
      <PublicationFeature publication={{ ...publication, purchaseLinks: [] }} poems={poems} />,
    );
    expect(screen.queryByText("Dónde conseguir el libro")).not.toBeInTheDocument();
    expect(screen.queryByText(/Próximamente/)).not.toBeInTheDocument();
  });
});
