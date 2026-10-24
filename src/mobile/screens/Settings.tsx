import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Bell, BellRing, Clapperboard, Database, ImagePlus, Globe, LogOut, Mail, MessageSquare, Moon, Printer, RotateCcw, Check, Star, Sun, SunMoon, Timer, Video, X, Volume2, Wallet, Zap } from "lucide-react";
import { ActionsGroup, ActionsLabel, BlockFooter, BlockTitle, List, ListItem, Toggle } from "konsta/react";
import { toast } from "sonner";
import storeHero from "@/assets/store-hero.jpg";
import loginBgVideo from "@/assets/login-bg.mp4";
import { resetMockDb } from "@/api/mock/handlers";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings, useUpdateSettings } from "@/hooks/queries";
import type { StoreSettings } from "@/api";
import { env, isMockApi } from "@/lib/env";
import { clearLoginMedia, MAX_LOGIN_MEDIA_MB, removeLibraryItem, selectLibraryItem, setLoginMedia, useLoginLibrary, useLoginMedia } from "@/lib/login-media";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/native";
import { ActionItem, Actions, IconTile, Loading, Screen } from "../ui";

const LANG = { en: "English", so: "Soomaali", ar: "العربية" } as const;

export default function SettingsScreen() {
  const { data } = useSettings();
  const update = useUpdateSettings();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sheet, setSheet] = useState<null | "timeout" | "language" | "theme" | "reset" | "loginBg">(null);
  const loginBg = useLoginMedia();
  const library = useLoginLibrary();
  const videoRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const pickBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await setLoginMedia(file);
      haptic.success();
      toast.success("Login background updated");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  const [s, setS] = useState<StoreSettings | null>(null);

  useEffect(() => {
    if (data) setS(data);
  }, [data]);

  // Settings save instantly, like iOS.
  const commit = (next: StoreSettings) => {
    setS(next);
    update.mutate(next);
  };
  const n = (k: keyof StoreSettings["notifications"]) => () => s && commit({ ...s, notifications: { ...s.notifications, [k]: !s.notifications[k] } });
  const o = <K extends keyof StoreSettings["orders"]>(k: K, v: StoreSettings["orders"][K]) => s && commit({ ...s, orders: { ...s.orders, [k]: v } });

  return (
    <Screen title="Settings" back tabbar>
      {!s ? (
        <Loading />
      ) : (
        <>
          <BlockTitle>Orders</BlockTitle>
          <List strong inset dividers>
            <ListItem media={<IconTile icon={Zap} className="bg-[#ff9500]" />} title="Auto-accept orders" after={<Toggle checked={s.orders.auto_accept_orders} onChange={() => o("auto_accept_orders", !s.orders.auto_accept_orders)} />} />
            <ListItem link media={<IconTile icon={Timer} className="bg-[#ff3b30]" />} title="Accept within" after={`${s.orders.accept_timeout_minutes} min`} onClick={() => setSheet("timeout")} />
            <ListItem media={<IconTile icon={Printer} className="bg-[#8e8e93]" />} title="Print on accept" after={<Toggle checked={s.orders.print_receipt_on_accept} onChange={() => o("print_receipt_on_accept", !s.orders.print_receipt_on_accept)} />} />
          </List>
          <BlockFooter>Orders that aren't accepted in time are cancelled automatically.</BlockFooter>

          <BlockTitle>Notifications</BlockTitle>
          <List strong inset dividers>
            <ListItem media={<IconTile icon={Volume2} className="bg-[#ff2d55]" />} title="New order sound" after={<Toggle checked={s.notifications.new_order_sound} onChange={n("new_order_sound")} />} />
            <ListItem media={<IconTile icon={BellRing} className="bg-[#ff3b30]" />} title="Push notifications" after={<Toggle checked={s.notifications.new_order_push} onChange={n("new_order_push")} />} />
            <ListItem media={<IconTile icon={MessageSquare} className="bg-[#34c759]" />} title="SMS for new orders" after={<Toggle checked={s.notifications.new_order_sms} onChange={n("new_order_sms")} />} />
            <ListItem media={<IconTile icon={Star} className="bg-[#ffcc00]" />} title="Review alerts" after={<Toggle checked={s.notifications.review_alerts} onChange={n("review_alerts")} />} />
            <ListItem media={<IconTile icon={Wallet} className="bg-[#219186]" />} title="Payout alerts" after={<Toggle checked={s.notifications.payout_alerts} onChange={n("payout_alerts")} />} />
            <ListItem media={<IconTile icon={Mail} className="bg-[#007aff]" />} title="Daily summary email" after={<Toggle checked={s.notifications.daily_summary_email} onChange={n("daily_summary_email")} />} />
          </List>

          <BlockTitle>App</BlockTitle>
          <List strong inset dividers>
            <ListItem link media={<IconTile icon={Moon} className="bg-[#5856d6]" />} title="Appearance" after={theme === "dark" ? "Dark" : theme === "system" ? "Automatic" : "Light"} onClick={() => setSheet("theme")} />
            <ListItem link media={<IconTile icon={Clapperboard} className="bg-[#ff2d55]" />} title="Login background" after={loginBg.media ? (loginBg.media.kind === "video" ? "Your video" : "Your photo") : "Default"} onClick={() => setSheet("loginBg")} />
            <ListItem link media={<IconTile icon={Globe} className="bg-[#007aff]" />} title="Language" after={LANG[s.language]} onClick={() => setSheet("language")} />
            {isMockApi && <ListItem link media={<IconTile icon={Database} className="bg-[#8e8e93]" />} title="Reset demo data" onClick={() => setSheet("reset")} />}
          </List>

          <List strong inset className="!mt-8">
            <ListItem link chevron={false} onClick={signOut} title={<span className="flex items-center gap-2 text-[#ff3b30]"><LogOut className="h-[18px] w-[18px]" /> Sign out</span>} />
          </List>
          <BlockFooter className="text-center">
            Diyaar Store · {env.apiMode === "mock" ? "Demo data" : "Live"}
            <br />
            <Bell className="inline h-3 w-3" /> Changes save automatically
          </BlockFooter>
        </>
      )}

      <Actions opened={sheet === "timeout"} onBackdropClick={() => setSheet(null)}>
        <ActionsGroup>
          <ActionsLabel>Accept new orders within</ActionsLabel>
          {[3, 5, 8, 10].map((m) => (
            <ActionItem key={m} icon={Timer} selected={s?.orders.accept_timeout_minutes === m} onClick={() => (o("accept_timeout_minutes", m), setSheet(null))}>
              {m} minutes
            </ActionItem>
          ))}
        </ActionsGroup>
      </Actions>

      <Actions opened={sheet === "language"} onBackdropClick={() => setSheet(null)}>
        <ActionsGroup>
          <ActionsLabel>Language</ActionsLabel>
          {(Object.keys(LANG) as Array<keyof typeof LANG>).map((l) => (
            <ActionItem key={l} icon={Globe} selected={s?.language === l} onClick={() => (s && commit({ ...s, language: l }), setSheet(null))}>
              {LANG[l]}
            </ActionItem>
          ))}
        </ActionsGroup>
      </Actions>

      <Actions opened={sheet === "theme"} onBackdropClick={() => setSheet(null)}>
        <ActionsGroup>
          <ActionsLabel>Appearance</ActionsLabel>
          {(
            [
              ["light", "Light", Sun],
              ["dark", "Dark", Moon],
              ["system", "Automatic", SunMoon],
            ] as const
          ).map(([v, label, icon]) => (
            <ActionItem key={v} icon={icon} selected={theme === v} onClick={() => (setTheme(v), setSheet(null))}>
              {label}
            </ActionItem>
          ))}
        </ActionsGroup>
      </Actions>

      <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={pickBg} />
      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={pickBg} />
      <Actions opened={sheet === "loginBg"} onBackdropClick={() => setSheet(null)}>
        <ActionsGroup>
          {/* live preview of the login hero */}
          <div className="relative h-40 overflow-hidden bg-black">
            {loginBg.media?.kind === "image" ? (
              <img src={loginBg.media.url} alt="" className="h-full w-full object-cover object-[center_35%]" />
            ) : (
              <video key={loginBg.media?.url ?? "default"} src={loginBg.media?.url ?? loginBgVideo} poster={loginBg.media ? undefined : storeHero} autoPlay loop muted playsInline className="h-full w-full object-cover object-[center_35%]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />
            <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[20px] font-extrabold text-white drop-shadow-md">Diyaar Store</p>
            <span className="absolute left-3 top-3 rounded-md bg-black/45 px-1.5 text-[11px] font-bold uppercase leading-[18px] text-white">{loginBg.media ? (loginBg.media.kind === "video" ? "Your video" : "Your photo") : "Default"}</span>
          </div>
          <ActionsLabel>Shown behind the sign-in form on this phone. Videos loop silently — keep them short, under {MAX_LOGIN_MEDIA_MB} MB.</ActionsLabel>

          {/* Recent: everything picked before, tap to reuse */}
          <div className="bg-white px-4 pb-3 pt-1 dark:bg-[#1c1c1d]">
            <p className="pb-2 text-left text-[12px] font-bold uppercase tracking-wide text-black/45 dark:text-white/50">Recent</p>
            <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 pt-1.5">
              {[{ id: null, kind: "video" as const, url: loginBgVideo, name: "Default" }, ...library.items].map((it) => {
                const active = library.activeId === it.id;
                return (
                  <div key={it.id ?? "default"} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        haptic.tap();
                        if (it.id) await selectLibraryItem(it.id);
                        else await clearLoginMedia();
                      }}
                      className={cn("relative block h-[92px] w-[68px] overflow-hidden rounded-xl bg-black ring-offset-2 ring-offset-white transition-transform active:scale-95 dark:ring-offset-[#1c1c1d]", active ? "ring-2 ring-primary" : "ring-1 ring-black/10 dark:ring-white/15")}
                    >
                      {it.kind === "image" ? (
                        <img src={it.url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <video src={`${it.url}#t=0.1`} poster={it.id ? undefined : storeHero} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                      )}
                      <span className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-md bg-black/55 text-white">
                        {it.kind === "video" ? <Video className="h-3 w-3" /> : <ImagePlus className="h-3 w-3" />}
                      </span>
                      {!it.id && <span className="absolute inset-x-0 top-1 text-center text-[10px] font-bold uppercase text-white drop-shadow">Default</span>}
                      {active && (
                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                          <Check className="h-3 w-3" strokeWidth={3.5} />
                        </span>
                      )}
                    </button>
                    {it.id && !active && (
                      <button
                        type="button"
                        aria-label="Remove from recent"
                        onClick={() => {
                          haptic.tap();
                          removeLibraryItem(it.id!);
                        }}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#1c1c1e] text-white ring-2 ring-white dark:bg-white dark:text-black dark:ring-[#1c1c1d]"
                      >
                        <X className="h-3 w-3" strokeWidth={3} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <ActionItem icon={Video} onClick={() => (setSheet(null), videoRef.current?.click())}>
            Choose a video
          </ActionItem>
          <ActionItem icon={ImagePlus} onClick={() => (setSheet(null), photoRef.current?.click())}>
            Choose a photo
          </ActionItem>
        </ActionsGroup>
      </Actions>

      <Actions opened={sheet === "reset"} onBackdropClick={() => setSheet(null)}>
        <ActionsGroup>
          <ActionsLabel>All demo changes will be lost.</ActionsLabel>
          <ActionItem
            icon={RotateCcw}
            danger
            onClick={() => {
              resetMockDb();
              window.location.reload();
            }}
          >
            Reset demo data
          </ActionItem>
        </ActionsGroup>
      </Actions>
    </Screen>
  );
}
