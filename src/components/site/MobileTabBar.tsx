import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Feather, Gem, Home, Menu, MessageCircle, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CONTACT_MAILTO } from "@/lib/contact";

const tabs = [
  { label: "Inicio", to: "/", icon: Home },
  { label: "Diamante", to: "/conoce-tu-diamante", icon: Gem },
  { label: "Coaching", to: "/coaching", icon: MessageCircle },
  { label: "Poesía", to: "/poesia", icon: Feather },
] as const;

const more = [
  { label: "Sobre mí", to: "/sobre-mi", icon: User },
  { label: "Publicaciones", to: "/publicaciones", icon: BookOpen },
  { label: "Contacto", to: "/contacto", icon: MessageCircle },
] as const;

const tabCls =
  "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[0.68rem] tracking-wide text-muted-foreground transition-colors data-[status=active]:text-primary";

export function MobileTabBar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(false), [pathname]);
  const moreActive = more.some((m) => pathname.startsWith(m.to));

  return (
    <div className="lg:hidden">
      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-40 bg-foreground/20"
            onClick={() => setOpen(false)}
          />
          <div className="fade-up fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 border border-border bg-card p-2">
            <ul>
              {more.map((m) => (
                <li key={m.to}>
                  <Link
                    to={m.to}
                    className="flex items-center gap-3 px-4 py-3 font-serif text-xl data-[status=active]:text-primary"
                  >
                    <m.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href={CONTACT_MAILTO}
              className="mt-2 block rounded-full bg-rose-soft px-6 py-3 text-center text-sm text-foreground"
            >
              Reserva tu sesión
            </a>
          </div>
        </>
      )}
      <nav
        aria-label="Principal móvil"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="flex">
          {tabs.map((t) => (
            <li key={t.to} className="flex flex-1">
              <Link to={t.to} activeOptions={{ exact: t.to === "/" }} className={tabCls}>
                <t.icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                {t.label}
              </Link>
            </li>
          ))}
          <li className="flex flex-1">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={`${tabCls} ${open || moreActive ? "text-primary" : ""}`}
            >
              {open ? <X className="h-5 w-5" strokeWidth={1.5} aria-hidden /> : <Menu className="h-5 w-5" strokeWidth={1.5} aria-hidden />}
              Más
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
