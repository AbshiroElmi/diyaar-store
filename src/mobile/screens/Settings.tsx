import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Bell, BellRing, Database, Globe, LogOut, Mail, MessageSquare, Moon, Printer, Star, Timer, Volume2, Wallet, Zap } from "lucide-react";
import { ActionsButton, ActionsGroup, ActionsLabel, BlockFooter, BlockTitle, List, ListItem, Toggle } from "konsta/react";
import { resetMockDb } from "@/api/mock/handlers";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings, useUpdateSettings } from "@/hooks/queries";
import type { StoreSettings } from "@/api";
import { env, isMockApi } from "@/lib/env";
import { Actions, IconTile, Loading, Screen } from "../ui";

const LANG = { en: "English", so: "Soomaali", ar: "العربية" } as const;

export default function SettingsScreen() {
  const { data } = useSettings();
  const update = useUpdateSettings();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sheet, setSheet] = useState<null | "timeout" | "language" | "theme" | "reset">(null);
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
            <ActionsButton key={m} bold={s?.orders.accept_timeout_minutes === m} onClick={() => (o("accept_timeout_minutes", m), setSheet(null))}>
              {m} minutes
            </ActionsButton>
          ))}
        </ActionsGroup>
      </Actions>

      <Actions opened={sheet === "language"} onBackdropClick={() => setSheet(null)}>
        <ActionsGroup>
          <ActionsLabel>Language</ActionsLabel>
          {(Object.keys(LANG) as Array<keyof typeof LANG>).map((l) => (
            <ActionsButton key={l} bold={s?.language === l} onClick={() => (s && commit({ ...s, language: l }), setSheet(null))}>
              {LANG[l]}
            </ActionsButton>
          ))}
        </ActionsGroup>
      </Actions>

      <Actions opened={sheet === "theme"} onBackdropClick={() => setSheet(null)}>
        <ActionsGroup>
          <ActionsLabel>Appearance</ActionsLabel>
          {[
            ["light", "Light"],
            ["dark", "Dark"],
            ["system", "Automatic"],
          ].map(([v, label]) => (
            <ActionsButton key={v} bold={theme === v} onClick={() => (setTheme(v), setSheet(null))}>
              {label}
            </ActionsButton>
          ))}
        </ActionsGroup>
      </Actions>

      <Actions opened={sheet === "reset"} onBackdropClick={() => setSheet(null)}>
        <ActionsGroup>
          <ActionsLabel>All demo changes will be lost.</ActionsLabel>
          <ActionsButton
            className="!text-[#ff3b30]"
            onClick={() => {
              resetMockDb();
              window.location.reload();
            }}
          >
            Reset demo data
          </ActionsButton>
        </ActionsGroup>
      </Actions>
    </Screen>
  );
}
