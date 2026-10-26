import type { ReactNode } from "react";

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-16 pt-12 sm:px-10 lg:pt-20">
      <p className="eyebrow fade-up">{eyebrow}</p>
      <h1 className="fade-up mt-6 max-w-4xl text-5xl leading-[1.02] sm:text-7xl">{title}</h1>
      {children && (
        <div className="fade-up mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">{children}</div>
      )}
    </section>
  );
}

/** Clearly marked placeholder for content still to be supplied. */
export function Pending({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-mist bg-mist-soft/50 px-6 py-8">
      <p className="eyebrow text-mist">Contenido pendiente</p>
      <p className="mt-2 font-serif text-2xl">{label}</p>
      {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-7xl border-t border-border px-6 py-16 sm:px-10 ${className}`}>{children}</section>;
}
