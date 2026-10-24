/**
 * Mobile building blocks shared by every mobile screen.
 * Built on Konsta UI so they render as iOS or Material depending on the device.
 */

import { useRef, useState, type ComponentProps, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Actions as KActions, ActionsButton, Block, Link as KLink, Navbar, NavbarBackLink, Page, Preloader, Searchbar, Sheet as KSheet, Toolbar, useTheme } from "konsta/react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check, RotateCw, X } from "lucide-react";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";

export const useIsIos = () => useTheme() === "ios";

// ── Screen ──────────────────────────────────────────────────

interface ScreenProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Show a back button (pushed screens). */
  back?: boolean;
  right?: ReactNode;
  subnavbar?: ReactNode;
  /** Leave space for the tab bar at the bottom. */
  tabbar?: boolean;
  onRefresh?: () => Promise<unknown>;
  children: ReactNode;
  footer?: ReactNode;
  /** No navbar — the screen draws its own header (Home). */
  bare?: boolean;
}

export function Screen({ title, subtitle, back, right, subnavbar, tabbar, onRefresh, children, footer, bare }: ScreenProps) {
  const navigate = useNavigate();
  const ios = useIsIos();
  return (
    <Page className={cn("no-scrollbar", !onRefresh && "overscroll-y-none")} colors={{ bgIos: "bg-[#f7f9f9] dark:bg-black", bgMaterial: "bg-[#f7f9f9] dark:bg-[#111]" }}>
      {!bare && (
      <Navbar
        title={title}
        subtitle={subtitle}
        centerTitle={ios}
        left={
          back ? (
            <NavbarBackLink
              showText={false}
              className="pl-2.5 [&_svg]:scale-[0.85] [&_svg]:origin-center"
              onClick={() => {
                haptic.tap();
                navigate(-1);
              }}
            />
          ) : undefined
        }
        // Mirror the back link's inset so right-side actions sit the same distance from the edge.
        right={right ? <div className="flex items-center pr-2.5 [&_svg]:h-6 [&_svg]:w-6">{right}</div> : undefined}
        subnavbar={subnavbar}
      />
      )}
      {onRefresh ? <PullToRefresh onRefresh={onRefresh}>{children}</PullToRefresh> : children}
      {footer}
      <div className={tabbar ? "h-[calc(9rem+env(safe-area-inset-bottom))]" : "h-[calc(1.5rem+env(safe-area-inset-bottom))]"} />
    </Page>
  );
}

// ── Pull to refresh ─────────────────────────────────────────

const PULL_TRIGGER = 72;

export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<unknown>; children: ReactNode }) {
  const startY = useRef<number | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const scroller = () => wrapper.current?.parentElement;

  return (
    <div
      ref={wrapper}
      onTouchStart={(e) => {
        if ((scroller()?.scrollTop ?? 0) <= 0 && !refreshing) startY.current = e.touches[0].clientY;
      }}
      onTouchMove={(e) => {
        if (startY.current === null) return;
        const dy = e.touches[0].clientY - startY.current;
        if (dy > 0) {
          const next = Math.min(110, dy * 0.5);
          if (pull < PULL_TRIGGER && next >= PULL_TRIGGER) haptic.tap();
          setPull(next);
        }
      }}
      onTouchEnd={async () => {
        startY.current = null;
        if (pull >= PULL_TRIGGER) {
          setRefreshing(true);
          setPull(56);
          await onRefresh().catch(() => undefined);
          setRefreshing(false);
        }
        setPull(0);
      }}
    >
      <div className="flex items-end justify-center overflow-hidden transition-[height] duration-200" style={{ height: pull }}>
        <span className="mb-3 flex h-8 w-8 items-center justify-center" style={{ transform: `rotate(${pull * 3}deg)`, opacity: Math.min(1, pull / PULL_TRIGGER) }}>
          {refreshing ? <Preloader className="h-6 w-6" /> : <RotateCw className="h-5 w-5 text-primary" />}
        </span>
      </div>
      {children}
    </div>
  );
}

// ── Small pieces ────────────────────────────────────────────

/** A coloured rounded-square icon, like iOS Settings. */
export function IconTile({ icon: Icon, className, size = "md" }: { icon: LucideIcon; className?: string; size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-7 w-7 rounded-[8px]" : size === "lg" ? "h-11 w-11 rounded-[12px]" : "h-[30px] w-[30px] rounded-[8px]";
  return (
    <span className={cn("flex shrink-0 items-center justify-center text-white", dims, className)}>
      <Icon className={size === "lg" ? "h-6 w-6" : "h-[18px] w-[18px]"} strokeWidth={2.2} />
    </span>
  );
}

/** Blinkit-style flat card: white, thin border, almost no shadow. */
export const CARD = "rounded-xl border border-black/[0.06] bg-white dark:border-white/10 dark:bg-[#1c1c1d]";

export const BRAND = "#219186";

export function SectionTitle({ children, action, onAction }: { children: ReactNode; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-end justify-between px-4 pb-2.5">
      <p className="text-[18px] font-extrabold tracking-tight">{children}</p>
      {action && (
        <button onClick={onAction} className="text-[14px] font-bold text-primary">
          {action}
        </button>
      )}
    </div>
  );
}

export function Kpi({ label, value, current, previous, invert, hint, className }: { label: string; value: string; current?: number; previous?: number; invert?: boolean; hint?: string; className?: string }) {
  const has = current !== undefined && previous !== undefined;
  const delta = has ? (previous ? ((current! - previous) / previous) * 100 : 0) : 0;
  const good = invert ? delta < 0 : delta >= 0;
  return (
    <div className={cn(CARD, "p-3.5", className)}>
      <p className="text-[12px] font-semibold uppercase tracking-wide text-black/45 dark:text-white/50">{label}</p>
      <p className="tabular mt-1 text-[22px] font-extrabold leading-tight tracking-tight">{value}</p>
      {has ? (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-black/45 dark:text-white/45">
          <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 font-bold", good ? "bg-[#e8f7ee] text-[#1a9d4b]" : "bg-[#ffecec] text-[#e5383b]")}>
            {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(0)}%
          </span>
          {hint ?? "vs before"}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-[11px] text-black/45 dark:text-white/45">{hint}</p>
      )}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex justify-center py-16">
      <Preloader />
    </div>
  );
}

export function Empty({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <Block className="flex flex-col items-center py-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
        <Icon className="h-7 w-7 text-black/40 dark:text-white/50" />
      </span>
      <p className="mt-4 text-[17px] font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-[260px] text-[15px] text-black/50 dark:text-white/50">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Block>
  );
}

export function ErrorBlock({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Empty
      icon={AlertTriangle}
      title="Couldn't load this"
      text={error instanceof Error ? error.message : "Something went wrong."}
      action={
        onRetry && (
          <button onClick={onRetry} className="font-semibold text-primary">
            Try again
          </button>
        )
      }
    />
  );
}

/** Horizontally scrolling filter chips. */
export function ChipBar<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: Array<{ value: T; label: string; count?: number }> }) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            onClick={() => {
              haptic.tap();
              onChange(it.value);
            }}
            className={cn(
              "flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-bold transition-colors",
              active ? "border-primary bg-primary/10 text-primary" : "border-black/10 bg-white text-black/70 dark:border-white/15 dark:bg-white/5 dark:text-white/80",
            )}
          >
            {it.label}
            {!!it.count && <span className={cn("tabular rounded-md px-1.5 text-[11px] leading-[18px]", active ? "bg-primary text-white" : "bg-black/[0.07] dark:bg-white/15")}>{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Thumbnail for products (photo or coloured initials). */
const THUMB = ["bg-[#34c759]", "bg-[#ff9500]", "bg-[#5856d6]", "bg-[#ff2d55]", "bg-[#007aff]", "bg-[#219186]"];
export function Thumb({ id, label, image, className }: { id: string; label: string; image?: string; className?: string }) {
  if (image) return <img src={image} alt="" className={cn("h-12 w-12 rounded-xl object-cover", className)} />;
  const color = THUMB[id.charCodeAt(id.length - 1) % THUMB.length];
  const letters = label
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[15px] font-semibold text-white", color, className)}>{letters}</span>;
}

// ── Overlays ────────────────────────────────────────────────
// Sheets render at the app root (above the tab bar, outside the page transition)
// and ride up with the iOS keyboard via the --kb variable set in lib/native.

const toRoot = (node: ReactNode) => createPortal(node, document.querySelector(".k-portal") ?? document.body);

export function Sheet({ className, ...props }: ComponentProps<typeof KSheet>) {
  return toRoot(<KSheet {...props} className={cn(props.opened && "kb-lift-sheet", className)} />);
}

export function Actions({ className, ...props }: ComponentProps<typeof KActions>) {
  return toRoot(<KActions {...props} className={cn(props.opened && "kb-lift-actions", className)} />);
}

/** Action-sheet row: tinted icon tile + label, left-aligned; `danger` turns it red, `selected` adds a check. */
export function ActionItem({ icon: Icon, children, onClick, danger, selected }: { icon: LucideIcon; children: ReactNode; onClick: () => void; danger?: boolean; selected?: boolean }) {
  return (
    <ActionsButton
      onClick={onClick}
      fontSizeIos="text-[17px]"
      fontSizeMaterial="text-[16px]"
      className={cn("!h-[60px] !justify-start gap-3.5 font-semibold", danger ? "!text-[#ff3b30]" : "!text-[#1c1c1e] dark:!text-white")}
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", danger ? "bg-[#ff3b30]/10 text-[#ff3b30]" : "bg-primary/10 text-primary")}>
        <Icon className="h-[19px] w-[19px]" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1 truncate text-left">{children}</span>
      {selected && <Check className="h-5 w-5 shrink-0 text-primary" strokeWidth={2.75} />}
    </ActionsButton>
  );
}

/** Search field: taller, light-teal fill (matches the "In stock" pill), round ✕ instead of "Cancel". */
export function SearchField({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <Searchbar
      className="k-search-teal"
      placeholder={placeholder}
      value={value}
      onInput={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      onClear={() => onChange("")}
      disableButton
      // Konsta types this as string but renders any node; the cast lets us show an icon.
      disableButtonText={
        (
          <span aria-label="Close search" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/[0.08] text-primary">
            <X className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </span>
        ) as unknown as string
      }
      onDisable={() => onChange("")}
    />
  );
}

// ── Form sheet (Close · Title · Save) ───────────────────────

export function SheetClose({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Close" className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.06] text-black/60 active:bg-black/10 dark:bg-white/10 dark:text-white/70">
      <X className="h-[18px] w-[18px]" strokeWidth={2.5} />
    </button>
  );
}

export function FormSheet({
  opened,
  onClose,
  title,
  onSave,
  saveLabel = "Save",
  saving,
  canSave = true,
  children,
}: {
  opened: boolean;
  onClose: () => void;
  title: string;
  onSave: () => void;
  saveLabel?: string;
  saving?: boolean;
  canSave?: boolean;
  children: ReactNode;
}) {
  return (
    <Sheet opened={opened} onBackdropClick={onClose} className="max-h-[calc(92dvh-var(--kb,0px))] w-full overflow-hidden rounded-t-[22px]">
      <Toolbar top className="rounded-t-[22px]">
        <SheetClose onClick={onClose} />
        <span className="text-[17px] font-semibold">{title}</span>
        <button
          type="button"
          disabled={!canSave || saving}
          onClick={onSave}
          className="mr-2 h-9 min-w-[72px] rounded-full bg-primary px-4 text-[15px] font-bold text-white transition-[opacity,transform] active:scale-95 disabled:opacity-35"
        >
          {saving ? "…" : saveLabel}
        </button>
      </Toolbar>
      <div className="no-scrollbar max-h-[calc(92dvh-44px-var(--kb,0px))] overflow-y-auto pb-[calc(2rem+env(safe-area-inset-bottom))]">{children}</div>
    </Sheet>
  );
}

// ── Category look (emoji + soft tint), Blinkit-style ────────

const CATEGORY_LOOK: Array<[RegExp, string, string]> = [
  [/breakfast|morning/i, "🍳", "bg-[#fff6db]"],
  [/grill|bbq|meat|kebab/i, "🍖", "bg-[#ffece6]"],
  [/rice|pasta|biryani/i, "🍚", "bg-[#f1f6e6]"],
  [/sandwich|wrap|burger/i, "🌯", "bg-[#fff1e3]"],
  [/juice|drink|shake|coffee/i, "🧃", "bg-[#e8f6ff]"],
  [/dessert|sweet|cake/i, "🍰", "bg-[#fdeef6]"],
];

export const categoryLook = (name: string): [RegExp, string, string] => CATEGORY_LOOK.find(([re]) => re.test(name)) ?? [/./, "🍽️", "bg-[#eef3f2]"];

/** Product picture: the photo when there is one, otherwise the category emoji on a soft tile. */
export function ProductArt({ category, image, className, emojiClassName }: { category: string; image?: string; className?: string; emojiClassName?: string }) {
  if (image) return <img src={image} alt="" className={cn("object-cover", className)} />;
  const [, emoji, tint] = categoryLook(category);
  return (
    <span className={cn("flex items-center justify-center", tint, className)}>
      <span className={cn("drop-shadow-sm", emojiClassName)}>{emoji}</span>
    </span>
  );
}
