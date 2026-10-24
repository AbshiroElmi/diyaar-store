import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Banner } from "@/api";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";

export const BANNER_THEMES: Record<Banner["theme"], { bg: string; text: string; cta: string }> = {
  lime: { bg: "from-[#e4ff7a] via-[#cfff3d] to-[#BEFF00]", text: "text-[#2B330F]", cta: "bg-[#2B330F] text-[#BEFF00]" },
  teal: { bg: "from-[#2aa898] via-[#219186] to-[#19766c]", text: "text-white", cta: "bg-[#BEFF00] text-[#2B330F]" },
  sunset: { bg: "from-[#ffb36b] via-[#ff8a5c] to-[#ff5e7a]", text: "text-white", cta: "bg-white text-[#e8505b]" },
  violet: { bg: "from-[#a99bff] via-[#7f72ff] to-[#5856d6]", text: "text-white", cta: "bg-white text-[#5856d6]" },
  ocean: { bg: "from-[#7fdcff] via-[#3fb0ff] to-[#007aff]", text: "text-white", cta: "bg-white text-[#007aff]" },
};

const AUTO_MS = 4500;

/** One banner tile — used by the Home carousel and the banner editor's live preview. */
export function BannerCard({ banner: b, onClick, className }: { banner: Pick<Banner, "title" | "subtitle" | "cta" | "theme" | "emoji" | "image">; onClick?: () => void; className?: string }) {
  const t = BANNER_THEMES[b.theme];
  const photo = !!b.image;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("relative flex h-[132px] w-full overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-left transition-transform active:scale-[0.98]", t.bg, photo ? "text-white" : t.text, className)}
    >
      {photo ? (
        <>
          {/* owner's photo fills the card; a dark fade on the left keeps the text readable */}
          <img src={b.image ?? undefined} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
        </>
      ) : (
        <>
          {/* soft decorative bubbles */}
          <span className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/20" />
          <span className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/10" />
          <span className="pointer-events-none absolute bottom-3 right-4 select-none text-[64px] leading-none drop-shadow-sm">{b.emoji}</span>
        </>
      )}

      <span className="relative flex max-w-[68%] flex-col">
        <span className="line-clamp-2 text-[20px] font-extrabold leading-[1.1] tracking-tight">{b.title}</span>
        <span className="mt-1 line-clamp-2 text-[12px] font-medium leading-snug opacity-90">{b.subtitle}</span>
        {b.cta && (
          <span className={cn("mt-auto inline-flex w-fit items-center gap-0.5 rounded-lg px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wide", photo ? "bg-white text-black" : t.cta)}>
            {b.cta} <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </span>
    </button>
  );
}

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const navigate = useNavigate();
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

  const open = (b: Banner) => {
    haptic.tap();
    if (b.link.startsWith("http")) window.open(b.link, "_blank");
    else navigate(b.link);
  };

  return (
    <div>
      <div
        ref={track}
        onScroll={onScroll}
        onTouchStart={() => (paused.current = true)}
        onTouchEnd={() => setTimeout(() => (paused.current = false), 3000)}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-2.5"
      >
        {banners.map((b) => (
          <div key={b.name} className="w-full shrink-0 snap-center px-4">
            <BannerCard banner={b} onClick={() => open(b)} />
          </div>
        ))}
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
