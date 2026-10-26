export type NavItem = {
  label: string;
  to: "/" | "/sobre-mi" | "/conoce-tu-diamante" | "/coaching" | "/poesia" | "/publicaciones" | "/contacto";
  children?: NavItem[];
};

export const sessionLinks: NavItem[] = [
  { label: "Conoce tu Diamante", to: "/conoce-tu-diamante" },
  { label: "Coaching", to: "/coaching" },
];

export const mainNav: (NavItem | { label: string; children: NavItem[] })[] = [
  { label: "Inicio", to: "/" },
  { label: "Sobre mí", to: "/sobre-mi" },
  { label: "Sesiones", children: sessionLinks },
  { label: "Poesía", to: "/poesia" },
  { label: "Publicaciones", to: "/publicaciones" },
  { label: "Contacto", to: "/contacto" },
];
