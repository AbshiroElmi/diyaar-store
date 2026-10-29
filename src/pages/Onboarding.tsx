import { useEffect, useRef, useState, type ReactNode } from "react";
import { BarChart3, Bell, Check, ChevronRight, Clock } from "lucide-react";
import { IntroVideo } from "@/components/shared/IntroVideo";
import { haptic, setStatusBarTheme } from "@/lib/native";
import { cn } from "@/lib/utils";

/** Slide 2: a new order arriving, written so it fits any kind of store. */
function OrderArt() {
  return (
    <div className="relative flex h-full items-center justify-center bg-gradient-to-br from-[#3fd0bd] via-[#219186] to-[#0f4f48] pb-[34vh]">
      <span className="absolute -left-10 top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <span className="absolute -right-8 bottom-10 h-40 w-40 rounded-full bg-[#BEFF00]/20 blur-2xl" />
      <div className="relative w-[78%] max-w-[300px]">
        <span className="absolute -right-4 -top-5 z-10 flex h-12 w-12 animate-bounce items-center justify-center rounded-full bg-[#BEFF00] text-[#2B330F] shadow-lg">
          <Bell className="h-6 w-6" strokeWidth={2.4} />
        </span>
        <div className="rotate-[-3deg] rounded-3xl bg-white p-4 text-[#1c1c1e] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#fff4e0] px-2.5 py-1 text-[12px] font-extrabold text-[#e07b00]">New order</span>
            <span className="flex items-center gap-1 text-[12px] font-semibold text-black/45">
              <Clock className="h-3.5 w-3.5" /> now
            </span>
          </div>
          <p className="mt-3 text-[17px] font-extrabold">#1024 · Amina H.</p>
          <div className="mt-2 space-y-1.5 text-[14px] text-black/70">
            {[
              ["🛒", "2 × Groceries basket"],
              ["💊", "1 × Pharmacy item"],
              ["📱", "1 × Phone charger"],
            ].map(([icon, label]) => (
              <p key={label} className="flex items-center gap-2">
                <span className="text-[16px]">{icon}</span> {label}
              </p>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-dashed border-black/10 pt-3">
            <span className="tabular text-[18px] font-extrabold">$24.50</span>
            <span className="flex items-center gap-1 rounded-xl bg-[#BEFF00] px-3.5 py-2 text-[14px] font-bold text-[#2B330F]">
              <Check className="h-4 w-4" strokeWidth={3} /> Accept
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Slide 3: products from many kinds of stores, a sold-out switch and a sales badge. */
function ProductsArt() {
  const items: Array<[string, string, string, boolean]> = [
    ["🍕", "Pizza", "bg-[#fff1e6]", true],
    ["💊", "Vitamins", "bg-[#e8f1ff]", true],
    ["🥖", "Bread", "bg-[#fdf6e3]", false],
    ["👕", "T-shirt", "bg-[#f0eeff]", true],
    ["🧴", "Lotion", "bg-[#e8f7ee]", true],
    ["📱", "Charger", "bg-[#ffeef2]", true],
  ];
  return (
    <div className="relative flex h-full items-center justify-center bg-gradient-to-b from-[#2aa898] via-[#16685f] to-[#0b3b36] pb-[34vh]">
      <div className="relative grid w-[80%] max-w-[310px] grid-cols-3 gap-2.5">
        {items.map(([emoji, label, tint, inStock], i) => (
          <div key={label} className={cn("rounded-2xl bg-white p-2 shadow-[0_10px_24px_-14px_rgba(15,79,72,0.5)] dark:bg-[#1c1c1d]", i % 2 ? "translate-y-3" : "")}>
            <div className={cn("flex aspect-square items-center justify-center rounded-xl text-[30px]", tint, !inStock && "opacity-40 grayscale")}>{emoji}</div>
            <p className="mt-1.5 truncate text-[11px] font-bold text-[#1c1c1e] dark:text-white">{label}</p>
            <span className={cn("mt-1 inline-block rounded-md px-1.5 text-[9px] font-extrabold uppercase leading-[15px]", inStock ? "bg-[#BEFF00]/25 text-[#2B330F] dark:bg-[#BEFF00]/15 dark:text-[#BEFF00]" : "bg-black/[0.06] text-black/45 dark:bg-white/10 dark:text-white/55")}>
              {inStock ? "In stock" : "Sold out"}
            </span>
          </div>
        ))}
        <span className="absolute -bottom-9 -right-3 flex items-center gap-1.5 rounded-2xl bg-[#1c1c1e] px-3 py-2 text-[13px] font-bold text-white shadow-lg">
          <BarChart3 className="h-4 w-4 text-[#BEFF00]" /> +18% sales
        </span>
      </div>
    </div>
  );
}

interface Slide {
  title: string;
  text: string;
  media: ReactNode;
}

const SLIDES: Slide[] = [
  {
    title: "Your store, in your pocket",
    text: "Restaurant, pharmacy, supermarket or shop: run your Diyaar store from your phone, wherever you are.",
    media: <IntroVideo className="h-full w-full" />,
  },
  {
    title: "Never miss an order",
    text: "New orders chime the moment they arrive. Accept, prepare and hand them over in a few taps.",
    media: <OrderArt />,
  },
  {
    title: "Your products, your way",
    text: "Add products with photos, change prices, mark items sold out, and follow your sales and earnings.",
    media: <ProductsArt />,
  },
];

/** First-launch introduction: three swipeable slides, shown once per phone. */
export default function OnboardingPage({ onDone }: { onDone: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  useEffect(() => {
    setStatusBarTheme(true);
  }, []);

  const goTo = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };
  const next = () => {
    haptic.tap();
    if (last) onDone();
    else goTo(index + 1);
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Slides fill the screen; the words sit in white on a shadow rising from the bottom. Swipe or tap Next. */}
      <div
        ref={track}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
      >
        {SLIDES.map((s) => (
          <section key={s.title} className="relative h-full w-full shrink-0 snap-center overflow-hidden">
            <div className="absolute inset-0">{s.media}</div>
            <span className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent" />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-black via-black/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-7 pb-[calc(env(safe-area-inset-bottom)+104px)]">
              <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-white drop-shadow-md">{s.title}</h1>
              <p className="mt-2.5 text-[16px] leading-relaxed text-white/85">{s.text}</p>
            </div>
          </section>
        ))}
      </div>

      <button
        type="button"
        onClick={onDone}
        className={cn("absolute right-4 top-[calc(env(safe-area-inset-top)+12px)] rounded-full bg-black/30 px-3.5 py-1.5 text-[14px] font-semibold text-white backdrop-blur transition-opacity", last && "pointer-events-none opacity-0")}
      >
        Skip
      </button>

      {/* Dots and the main button */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-7 pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <div className="flex gap-1.5">
          {SLIDES.map((s, i) => (
            <button key={s.title} type="button" aria-label={`Slide ${i + 1}`} onClick={() => goTo(i)} className={cn("h-2 rounded-full transition-all duration-300", i === index ? "w-6 bg-[#BEFF00]" : "w-2 bg-white/35")} />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          className={cn("flex h-12 items-center justify-center gap-1 rounded-2xl bg-primary font-bold text-primary-foreground shadow-[0_10px_24px_-8px_rgba(0,0,0,0.6)] transition-all active:scale-[0.97]", last ? "px-7 text-[16px]" : "w-12")}
          aria-label={last ? "Get started" : "Next"}
        >
          {last ? "Get started" : <ChevronRight className="h-6 w-6" strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  );
}
