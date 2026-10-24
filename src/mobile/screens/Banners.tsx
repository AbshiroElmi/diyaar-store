import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Camera, Check, Eye, EyeOff, GalleryHorizontal, Pencil, Plus, Smile, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ActionsGroup, ActionsLabel, BlockFooter, Link as KLink, List, ListInput, Toggle } from "konsta/react";
import { useBanners, useDeleteBanner, useSaveBanner } from "@/hooks/queries";
import type { Banner } from "@/api";
import { haptic } from "@/lib/native";
import { readPhoto } from "@/lib/photo";
import { cn } from "@/lib/utils";
import { BANNER_THEMES, BannerCard } from "../BannerCarousel";
import { ActionItem, Actions, Empty, ErrorBlock, FormSheet, Loading, Screen } from "../ui";

const THEME_LABEL: Record<Banner["theme"], string> = { lime: "Lime", teal: "Teal", sunset: "Sunset", violet: "Violet", ocean: "Ocean" };
const EMOJIS = ["🛵", "🔥", "🎉", "🍔", "🍕", "🌯", "🍗", "🍰", "🧃", "☕", "⭐", "📈", "📸", "💸", "🎁", "❤️"];

/** Where the banner's button takes the customer/owner. */
const LINKS = [
  { value: "/promotions", label: "Promotions" },
  { value: "/products", label: "Menu items" },
  { value: "/orders", label: "Orders" },
  { value: "/reports", label: "Reports" },
  { value: "/reviews", label: "Reviews" },
  { value: "/store", label: "Store profile" },
];

type Draft = Omit<Banner, "name" | "sort_order">;
const EMPTY: Draft = { title: "", subtitle: "", cta: "Learn more", link: "/promotions", theme: "lime", emoji: "🛵", is_active: 1 };

const TEMPLATES: Array<{ label: string; draft: Draft }> = [
  { label: "Free delivery", draft: { title: "Free Delivery Fridays", subtitle: "No delivery fee on every order this Friday", cta: "Order now", link: "/promotions", theme: "lime", emoji: "🛵", is_active: 1 } },
  { label: "Discount", draft: { title: "20% off this weekend", subtitle: "On all grills and platters", cta: "See deals", link: "/promotions", theme: "sunset", emoji: "🔥", is_active: 1 } },
  { label: "New item", draft: { title: "New on the menu", subtitle: "Try our latest dish today", cta: "View menu", link: "/products", theme: "violet", emoji: "🎉", is_active: 1 } },
];

function BannerEditor({ editing, onClose }: { editing: Banner | "new" | null; onClose: () => void }) {
  const save = useSaveBanner();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [openedFor, setOpenedFor] = useState<Banner | "new" | null>(null);
  const [pictureMode, setPictureMode] = useState<"emoji" | "photo">("emoji");
  const fileRef = useRef<HTMLInputElement>(null);
  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setDraft((d) => ({ ...d, image: undefined }));
      const image = await readPhoto(file, 1200);
      setDraft((d) => ({ ...d, image }));
      haptic.tap();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // Reset the form each time the sheet opens for a different banner.
  if (editing !== openedFor) {
    setOpenedFor(editing);
    if (editing) setDraft(editing === "new" ? EMPTY : { title: editing.title, subtitle: editing.subtitle, cta: editing.cta, link: editing.link, theme: editing.theme, emoji: editing.emoji, image: editing.image, is_active: editing.is_active ?? 1 });
    if (editing) setPictureMode(editing !== "new" && editing.image ? "photo" : "emoji");
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const isNew = editing === "new";

  return (
    <FormSheet
      opened={!!editing}
      onClose={onClose}
      title={isNew ? "New banner" : "Edit banner"}
      saveLabel={isNew ? "Add" : "Save"}
      saving={save.isPending}
      canSave={!!draft.title.trim() && (pictureMode === "emoji" || !!draft.image)}
      onSave={() =>
        save.mutate(
          {
            id: isNew || !editing ? undefined : editing.name,
            // Emoji mode clears any photo so the banner goes back to the colour + emoji look.
            data: { ...draft, image: pictureMode === "photo" ? draft.image ?? null : null, title: draft.title.trim(), subtitle: draft.subtitle.trim(), cta: draft.cta.trim() },
          },
          { onSuccess: onClose },
        )
      }
    >
      {/* Live preview — exactly what shows on Home */}
      <div className="px-4 pt-4">
        <BannerCard banner={{ ...draft, image: pictureMode === "photo" ? draft.image : undefined, title: draft.title || "Your headline", subtitle: draft.subtitle || "A short line that explains the offer" }} className="pointer-events-none shadow-[0_12px_28px_-14px_rgba(0,0,0,0.4)]" />
      </div>

      {isNew && (
        <>
          <p className="px-5 pb-2 pt-5 text-[13px] font-bold uppercase tracking-wide text-black/45 dark:text-white/50">Start from</p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => {
                  haptic.tap();
                  setDraft(t.draft);
                }}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 text-[13px] font-bold text-black/70 active:scale-95 dark:border-white/15 dark:bg-[#1c1c1d] dark:text-white/75"
              >
                <span>{t.draft.emoji}</span> {t.label}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="px-5 pb-2 pt-5 text-[13px] font-bold uppercase tracking-wide text-black/45 dark:text-white/50">Colour</p>
      <div className="flex gap-3 px-4">
        {(Object.keys(BANNER_THEMES) as Array<Banner["theme"]>).map((th) => (
          <button
            key={th}
            type="button"
            aria-label={THEME_LABEL[th]}
            onClick={() => {
              haptic.tap();
              set("theme", th);
            }}
            className={cn("relative h-11 flex-1 rounded-xl bg-gradient-to-br transition-transform active:scale-95", BANNER_THEMES[th].bg, draft.theme === th && "ring-2 ring-primary ring-offset-2 ring-offset-[#f7f9f9] dark:ring-offset-[#111]")}
          >
            {draft.theme === th && <Check className={cn("absolute inset-0 m-auto h-5 w-5", BANNER_THEMES[th].text)} strokeWidth={3} />}
          </button>
        ))}
      </div>

      <p className="px-5 pb-2 pt-5 text-[13px] font-bold uppercase tracking-wide text-black/45 dark:text-white/50">Picture</p>
      <div className="mx-4 mb-3 grid grid-cols-2 rounded-xl bg-primary/[0.08] p-1">
        {(
          [
            ["emoji", "Emoji", Smile],
            ["photo", "Your photo", Camera],
          ] as const
        ).map(([mode, label, Icon]) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              haptic.tap();
              setPictureMode(mode);
              if (mode === "photo" && !draft.image) fileRef.current?.click();
            }}
            className={cn("flex h-9 items-center justify-center gap-1.5 rounded-[10px] text-[14px] font-bold transition-colors", pictureMode === mode ? "bg-white text-primary shadow-sm dark:bg-[#2c2c2e]" : "text-black/50 dark:text-white/55")}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
      {pictureMode === "photo" ? (
        <div className="flex items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-primary/40 bg-primary/[0.06] text-primary"
          >
            {draft.image ? <img src={draft.image} alt="" className="h-full w-full object-cover" /> : <Camera className="h-6 w-6" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold">{draft.image ? "Photo added" : "Add a photo"}</p>
            <p className="text-[12.5px] text-black/45 dark:text-white/50">A wide photo of your food works best. Text sits on the left.</p>
            <div className="mt-1 flex gap-3 text-[13px] font-semibold">
              <button type="button" onClick={() => fileRef.current?.click()} className="text-primary">
                {draft.image ? "Change" : "Choose photo"}
              </button>
              {draft.image && (
                <button type="button" onClick={() => setDraft((d) => ({ ...d, image: undefined }))} className="text-[#ff3b30]">
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-8 gap-1.5 px-4">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => {
              haptic.tap();
              set("emoji", e);
            }}
            className={cn("flex aspect-square items-center justify-center rounded-xl text-[22px] transition-transform active:scale-90", draft.emoji === e ? "bg-primary/15 ring-2 ring-primary" : "bg-black/[0.04] dark:bg-white/[0.06]")}
          >
            {e}
          </button>
        ))}
      </div>
      )}

      <p className="px-5 pt-5 text-[13px] font-bold uppercase tracking-wide text-black/45 dark:text-white/50">Text</p>
      <List strongIos insetIos className="!mt-2">
        <ListInput label="Headline" placeholder="e.g. Free Delivery Fridays" value={draft.title} onInput={(e: React.ChangeEvent<HTMLInputElement>) => set("title", e.target.value.slice(0, 40))} />
        <ListInput label="Subtitle" placeholder="e.g. No delivery fee all day" value={draft.subtitle} onInput={(e: React.ChangeEvent<HTMLInputElement>) => set("subtitle", e.target.value.slice(0, 70))} />
        <ListInput label="Button text" placeholder="e.g. Order now" value={draft.cta} onInput={(e: React.ChangeEvent<HTMLInputElement>) => set("cta", e.target.value.slice(0, 18))} />
      </List>

      <p className="px-5 pb-2 pt-5 text-[13px] font-bold uppercase tracking-wide text-black/45 dark:text-white/50">Button opens</p>
      <div className="flex flex-wrap gap-2 px-4">
        {LINKS.map((l) => (
          <button
            key={l.value}
            type="button"
            onClick={() => {
              haptic.tap();
              set("link", l.value);
            }}
            className={cn(
              "h-9 rounded-full border px-3.5 text-[13px] font-bold transition-colors",
              draft.link === l.value ? "border-primary bg-primary text-white" : "border-black/10 bg-white text-black/70 dark:border-white/15 dark:bg-[#1c1c1d] dark:text-white/75",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
    </FormSheet>
  );
}

export default function BannersScreen() {
  const { data, isLoading, error, refetch } = useBanners();
  const save = useSaveBanner();
  const remove = useDeleteBanner();
  const [editing, setEditing] = useState<Banner | "new" | null>(null);
  const [selected, setSelected] = useState<Banner | null>(null);
  const live = data?.filter((b) => b.is_active !== 0).length ?? 0;

  const move = (b: Banner, dir: -1 | 1) => {
    const i = data!.findIndex((x) => x.name === b.name);
    const other = data![i + dir];
    if (!other) return;
    save.mutate({ id: b.name, data: { sort_order: other.sort_order }, silent: true });
    save.mutate({ id: other.name, data: { sort_order: b.sort_order }, silent: true });
  };

  return (
    <Screen
      title="Home banners"
      subtitle={data ? `${live} showing on Home` : undefined}
      back
      tabbar
      onRefresh={refetch}
      right={
        <KLink navbar iconOnly onClick={() => setEditing("new")}>
          <Plus className="h-7 w-7" />
        </KLink>
      }
    >
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty
          icon={GalleryHorizontal}
          title="No banners yet"
          text="Banners slide across the top of Home. Use them to push a deal or a new dish."
          action={
            <button className="font-semibold text-primary" onClick={() => setEditing("new")}>
              Create a banner
            </button>
          }
        />
      ) : (
        <>
          <div className="space-y-4 px-4 pt-4">
            {data.map((b) => {
              const hidden = b.is_active === 0;
              return (
                <div key={b.name}>
                  <BannerCard banner={b} onClick={() => setSelected(b)} className={cn(hidden && "opacity-45 grayscale")} />
                  <div className="mt-2 flex items-center gap-2 px-1">
                    <span className={cn("rounded-md px-1.5 text-[11px] font-bold uppercase leading-[18px]", hidden ? "bg-black/[0.06] text-black/50 dark:bg-white/10 dark:text-white/55" : "bg-primary/10 text-primary")}>
                      {hidden ? "Hidden" : "Showing"}
                    </span>
                    <span className="truncate text-[12.5px] text-black/45 dark:text-white/50">Opens {LINKS.find((l) => l.value === b.link)?.label ?? b.link}</span>
                    <span className="ml-auto">
                      <Toggle checked={!hidden} onChange={() => save.mutate({ id: b.name, data: { is_active: hidden ? 1 : 0 }, silent: true })} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <BlockFooter>Tap a banner to edit, reorder or delete it. Switch one off to hide it from Home without losing it.</BlockFooter>
        </>
      )}

      <BannerEditor editing={editing} onClose={() => setEditing(null)} />

      <Actions opened={!!selected} onBackdropClick={() => setSelected(null)}>
        <ActionsGroup>
          <ActionsLabel>{selected?.title}</ActionsLabel>
          <ActionItem icon={Pencil} onClick={() => (selected && setEditing(selected), setSelected(null))}>
            Edit banner
          </ActionItem>
          <ActionItem icon={selected?.is_active === 0 ? Eye : EyeOff} onClick={() => (selected && save.mutate({ id: selected.name, data: { is_active: selected.is_active === 0 ? 1 : 0 }, silent: true }), setSelected(null))}>
            {selected?.is_active === 0 ? "Show on Home" : "Hide from Home"}
          </ActionItem>
          <ActionItem icon={ArrowUp} onClick={() => (selected && move(selected, -1), setSelected(null))}>
            Move up
          </ActionItem>
          <ActionItem icon={ArrowDown} onClick={() => (selected && move(selected, 1), setSelected(null))}>
            Move down
          </ActionItem>
          <ActionItem icon={Trash2} danger onClick={() => (selected && remove.mutate(selected.name), setSelected(null))}>
            Delete
          </ActionItem>
        </ActionsGroup>
      </Actions>
    </Screen>
  );
}
