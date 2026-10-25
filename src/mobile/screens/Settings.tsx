import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun, SunMoon, Volume2, Zap } from "lucide-react";
import { ActionsGroup, ActionsLabel, BlockFooter, BlockTitle, List, ListItem, Toggle } from "konsta/react";
import { useAuth } from "@/contexts/AuthContext";
import { useSetAutoAccept, useStore } from "@/hooks/queries";
import { getAppVersion } from "@/lib/native";
import { useOrderSound } from "@/lib/prefs";
import { ActionItem, Actions, IconTile, Loading, Screen } from "../ui";

export default function SettingsScreen() {
  const { data: s } = useStore();
  const autoAccept = useSetAutoAccept();
  const [orderSound, setOrderSound] = useOrderSound();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sheet, setSheet] = useState<null | "theme">(null);
  const [version, setVersion] = useState("");

  useEffect(() => {
    getAppVersion().then(setVersion);
  }, []);

  return (
    <Screen title="Settings" back tabbar>
      {!s ? (
        <Loading />
      ) : (
        <>
          <BlockTitle>Orders</BlockTitle>
          <List strong inset dividers>
            <ListItem media={<IconTile icon={Zap} className="bg-[#ff9500]" />} title="Auto-accept orders" after={<Toggle checked={!!s.auto_accept_orders} onChange={() => autoAccept.mutate(!s.auto_accept_orders)} />} />
            <ListItem media={<IconTile icon={Volume2} className="bg-[#ff2d55]" />} title="New order sound" after={<Toggle checked={orderSound} onChange={() => setOrderSound(!orderSound)} />} />
          </List>
          <BlockFooter>The sound plays on this phone while the app is open.</BlockFooter>

          <BlockTitle>App</BlockTitle>
          <List strong inset dividers>
            <ListItem link media={<IconTile icon={Moon} className="bg-[#5856d6]" />} title="Appearance" after={theme === "dark" ? "Dark" : theme === "system" ? "Automatic" : "Light"} onClick={() => setSheet("theme")} />
          </List>

          <List strong inset className="!mt-8">
            <ListItem link chevron={false} onClick={signOut} title={<span className="flex items-center gap-2 text-[#ff3b30]"><LogOut className="h-[18px] w-[18px]" /> Sign out</span>} />
          </List>
          {version && <p className="mt-4 w-full text-center text-[13px] text-black/45 dark:text-white/45">Version {version}</p>}
        </>
      )}

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
    </Screen>
  );
}
