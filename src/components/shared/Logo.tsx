import mark from "@/assets/diyaar-mark.png";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img src={mark} alt="" className={cn("shrink-0", compact ? "h-8 w-8" : "h-9 w-9")} />
      <span className="leading-none">
        <span className={cn("block font-bold tracking-tight", compact ? "text-base" : "text-lg")}>Diyaar</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Store</span>
      </span>
    </div>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return <img src={mark} alt="Diyaar" className={className} />;
}
