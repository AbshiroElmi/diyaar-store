import { useEffect, useRef, useState } from "react";
import type { Banner } from "@/api";
import { cn } from "@/lib/utils";

const AUTO_MS = 4500;

/** One Diyaar banner, drawn the way the customer app shows it. */
export function BannerCard({ banner: b, badge, onClick, className }: { banner: Banner; badge?: string; onClick?: () => void; className?: string }) {
  // "image" banners carry their own text in the picture.
  const showText = b.display_mode !== "image" || !b.image;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={b.image ? undefined : { background: b.background ?? "linear-gradient(135deg, #2aa898, #19766c)" }}
      className={cn("relative flex h-[140px] w-full items-end overflow-hidden rounded-2xl bg-black/5 p-4 text-left text-white transition-transform enabled:active:scale-[0.98] dark:bg-white/10", className)}
    >
      {b.image && <img src={b.image} alt="" loading="lazy" decoding="async" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />}
      {showText && (
        <>
          {b.image && <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />}
          <span className="relative flex max-w-[85%] flex-col">
            <span className="line-clamp-2 text-[18px] font-extrabold leading-[1.15] tracking-tight drop-shadow-sm">{b.title}</span>
            {b.subtitle && <span className="mt-0.5 line-clamp-1 text-[12.5px] font-medium opacity-90">{b.subtitle}</span>}
          </span>
        </>
      )}
      {badge && <span className="absolute left-3 top-3 rounded-md bg-[#BEFF00] px-1.5 text-[11px] font-extrabold uppercase leading-[18px] text-[#2B330F]">{badge}</span>}
    </button>
  );
}

export function BannerCarousel({ banners, isMine, onOpenMine }: { banners: Banner[]; isMine: (b: Banner) => boolean; onOpenMine: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  // Keep the dots in sync with manual swipes.
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  // Auto-advance, looping back to the first banner.
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => {
      const el = track.current;
      if (!el || paused.current) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % banners.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [banners.length]);

  return (
    <div>
      <div
        ref={track}
        onScroll={onScroll}
        onTouchStart={() => (paused.current = true)}
        onTouchEnd={() => setTimeout(() => (paused.current = false), 3000)}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-2.5"
      >
        {banners.map((b) => {
          const mine = isMine(b);
          // Other stores' banners just show; the store's own opens its menu.
          return (
            <div key={b.name} className="w-full shrink-0 snap-center px-4">
              <BannerCard banner={b} badge={mine ? "Your store" : undefined} onClick={mine ? onOpenMine : undefined} />
            </div>
          );
        })}
      </div>
      {banners.length > 1 && (
        <div className="-mt-1 flex justify-center gap-1.5">
          {banners.map((b, i) => (
            <span key={b.name} className={cn("h-1.5 rounded-full transition-all duration-300", i === index ? "w-5 bg-primary" : "w-1.5 bg-black/15 dark:bg-white/25")} />
          ))}
        </div>
      )}
    </div>
  );
}
