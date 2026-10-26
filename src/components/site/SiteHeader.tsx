import { CONTACT_MAILTO } from "@/lib/contact";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Signature } from "./Signature";
import { mainNav, sessionLinks } from "./nav";

const linkCls =
  "relative py-1 text-[0.92rem] text-foreground/80 transition-colors hover:text-foreground data-[status=active]:text-foreground data-[status=active]:after:absolute data-[status=active]:after:inset-x-0 data-[status=active]:after:-bottom-1 data-[status=active]:after:h-px data-[status=active]:after:bg-rose";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(false), [pathname]);
  const sessionsActive = sessionLinks.some((l) => l.to === pathname);

  return (
    <header className="relative z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-6 sm:px-10 lg:py-8">
        <Link to="/" aria-label="Trinidad López · Trinity — Inicio" className="min-w-0 shrink">
          <Signature size="md" />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-8 lg:flex">
          {mainNav.map((item) =>
            "to" in item && item.to ? (
              <Link key={item.label} to={item.to} className={linkCls} activeOptions={{ exact: true }}>
                {item.label}
              </Link>
            ) : (
              <div key={item.label} className="group relative">
                <button
                  type="button"
                  aria-haspopup="true"
                  className={`${linkCls} inline-flex items-center gap-1 ${sessionsActive ? "text-foreground" : ""}`}
                >
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
                </button>
                <div className="invisible absolute left-1/2 top-full z-40 -translate-x-1/2 pt-3 opacity-0 transition-opacity duration-300 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <ul className="min-w-56 border border-border bg-card py-2">
                    {item.children?.map((c) => (
                      <li key={c.to}>
                        <Link
                          to={c.to}
                          className="block px-5 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground data-[status=active]:text-primary"
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ),
          )}
        </nav>

        <a
          href={CONTACT_MAILTO}
          className="hidden rounded-full bg-rose-soft px-6 py-2.5 text-sm text-foreground transition-colors hover:bg-rose/40 lg:inline-block"
        >
          Reserva tu sesión
        </a>

        <button
          type="button"
          className="shrink-0 p-2 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Principal móvil"
          className="fade-up border-y border-border bg-background px-6 pb-10 pt-4 lg:hidden"
        >
          <ul className="space-y-1">
            {mainNav.map((item) =>
              "to" in item && item.to ? (
                <li key={item.label}>
                  <Link to={item.to} activeOptions={{ exact: true }} className="block py-3 font-serif text-2xl data-[status=active]:text-primary">
                    {item.label}
                  </Link>
                </li>
              ) : (
                <li key={item.label} className="py-3">
                  <span className="eyebrow">{item.label}</span>
                  <ul className="mt-2 space-y-1 border-l border-border pl-5">
                    {item.children?.map((c) => (
                      <li key={c.to}>
                        <Link to={c.to} className="block py-2 font-serif text-xl data-[status=active]:text-primary">
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ),
            )}
          </ul>
          <a
            href={CONTACT_MAILTO}
            className="mt-8 inline-block rounded-full border border-rose px-6 py-3 text-sm hover:bg-rose-soft"
          >
            Reserva tu sesión
          </a>
        </nav>
      )}
    </header>
  );
}
