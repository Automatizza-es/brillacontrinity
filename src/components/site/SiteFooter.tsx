import { CONTACT_EMAIL, CONTACT_MAILTO, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/contact";
import { Link } from "@tanstack/react-router";
import { Signature } from "./Signature";
import { mainNav } from "./nav";

export function SiteFooter() {
  const flat = mainNav.flatMap((i) => ("children" in i && i.children ? i.children : [i]));
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:px-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Signature size="sm" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Autoconocimiento, coaching y poesía.
          </p>
        </div>
        <nav aria-label="Pie de página">
          <p className="eyebrow mb-4">Navegación</p>
          <ul className="space-y-2 text-sm">
            {flat.map((l) =>
              "to" in l && l.to ? (
                <li key={l.to}>
                  <Link to={l.to} className="text-foreground/80 hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ) : null,
            )}
          </ul>
        </nav>
        <div>
          <p className="eyebrow mb-4">Contacto</p>
          <ul className="space-y-2 text-sm">
            <li><a href={CONTACT_MAILTO} className="text-foreground/80 hover:text-primary">{CONTACT_EMAIL}</a></li>
            <li><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="text-foreground/80 hover:text-primary">Instagram · @{INSTAGRAM_HANDLE}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-6 py-6 text-xs text-muted-foreground sm:px-10">
          © {new Date().getFullYear()} Trinidad López · Trinity
        </p>
      </div>
    </footer>
  );
}
