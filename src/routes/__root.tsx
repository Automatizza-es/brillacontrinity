import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileTabBar } from "@/components/site/MobileTabBar";

function NotFoundComponent() {
  return (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-5xl">Esta página no existe.</h1>
      <Link to="/" className="text-link mt-10">Volver al inicio</Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      <h1 className="text-4xl">No se ha podido cargar la página.</h1>
      <button
        onClick={() => {
          router.invalidate();
          reset();
        }}
        className="text-link mt-10"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Trinidad López" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&family=Mrs+Saint+Delafield&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const isPalettePreview = useRouterState({ select: (state) => state.location.pathname === "/sobre-mi" });
  return (
    <QueryClientProvider client={queryClient}>
      <div data-palette={isPalettePreview ? "violet-preview" : undefined}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-card focus:px-4 focus:py-2">
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="main">
        <Outlet />
      </main>
      <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <SiteFooter />
      </div>
      <MobileTabBar />
      </div>
    </QueryClientProvider>
  );
}
