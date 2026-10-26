import { cn } from "@/lib/utils";

/** Author signature: "Trinidad López" in serif + "Trinity" handwritten. */
export function Signature({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const serif = { sm: "text-lg", md: "text-xl sm:text-2xl", lg: "text-2xl sm:text-3xl" }[size];
  const script = { sm: "text-3xl", md: "text-4xl sm:text-5xl", lg: "text-5xl sm:text-6xl" }[size];
  return (
    <span className={cn("inline-flex items-baseline gap-3 whitespace-nowrap", className)}>
      <span className={cn("font-serif tracking-wide text-foreground", serif)}>Trinidad López</span>
      <span className={cn("font-script leading-none text-rose -mb-1", script)} aria-label="Trinity">
        Trinity
      </span>
    </span>
  );
}
