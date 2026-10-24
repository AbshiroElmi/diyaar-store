import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, FlaskConical, LogOut, Menu, Moon, Sun, UserRound, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, useOrderCounts, useReviews, useSettings, useStore } from "@/hooks/queries";
import { useIsMobile } from "@/hooks/use-media";
import { isMockApi } from "@/lib/env";
import { haptic, registerBackButton } from "@/lib/native";
import { initials } from "@/lib/format";
import { MOBILE_TABS, NAV_SECTIONS, findNavItem, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { NotificationsPopover } from "./NotificationsPopover";
import { StoreStatusControl } from "./StoreStatusControl";

function useBadges(): Record<NonNullable<NavItem["badge"]>, number> {
  const { data: counts } = useOrderCounts();
  const { data: notifications } = useNotifications();
  const { data: reviews } = useReviews({ filter: "unreplied" });
  return {
    orders: counts?.confirming ?? 0,
    notifications: notifications?.unread ?? 0,
    reviews: reviews?.summary.unreplied ?? 0,
  };
}

function Badge({ value, tone = "default" }: { value: number; tone?: "default" | "alert" }) {
  if (!value) return null;
  return (
    <span
      className={cn(
        "tabular ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
        tone === "alert" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

// ── Desktop sidebar ─────────────────────────────────────────

function Sidebar() {
  const badges = useBadges();
  const { data: store } = useStore();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar lg:flex">
      <div className="flex h-16 items-center border-b px-5">
        <Logo />
      </div>

      <Link to="/store" className="mx-3 mt-4 flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/50">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
          {store ? initials(store.store_name) : "…"}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{store?.store_name ?? "Loading…"}</span>
          <span className="block truncate text-xs text-muted-foreground">{store?.service_type ?? ""}</span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{section.label}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    end={item.href === "/"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-muted",
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {item.title}
                    {item.badge && <Badge value={badges[item.badge]} tone={item.badge === "orders" ? "alert" : "default"} />}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

// ── Top bar ─────────────────────────────────────────────────

function UserMenu() {
  const { user, store, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const name = user?.full_name ?? store?.owner_name ?? "Store owner";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-0.5 pr-1 transition-colors hover:bg-muted sm:pr-2" aria-label="Account menu">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">{initials(name)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight">{name}</span>
            <span className="block text-xs leading-tight text-muted-foreground">{user?.role ?? "Owner"}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email ?? store?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/store")}>
          <UserRound className="mr-2 h-4 w-4" /> Store profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Topbar() {
  const { pathname } = useLocation();
  const current = findNavItem(pathname);
  const isMobile = useIsMobile();

  return (
    <header className="pt-safe sticky top-0 z-20 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-14 items-center gap-3 px-4 sm:h-16 sm:px-6">
      <div className="lg:hidden">
        <Logo compact />
      </div>
      <p className="hidden text-sm text-muted-foreground lg:block">
        Portal <ChevronRight className="inline h-3.5 w-3.5" /> <span className="font-medium text-foreground">{current?.title ?? ""}</span>
      </p>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {isMockApi && (
          <span className="hidden items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground md:inline-flex" title="VITE_API_MODE=mock">
            <FlaskConical className="h-3.5 w-3.5" /> Demo data
          </span>
        )}
        <StoreStatusControl compact={isMobile} />
        <NotificationsPopover />
        <UserMenu />
      </div>
      </div>
    </header>
  );
}

// ── Mobile bottom navigation ────────────────────────────────

/** The Menu sheet only lists pages that aren't already in the bottom bar. */
const MENU_SECTIONS = NAV_SECTIONS.map((section) => ({
  ...section,
  items: section.items.filter((item) => !MOBILE_TABS.some((tab) => tab.href === item.href)),
})).filter((section) => section.items.length > 0);

const SECTION_TINT: Record<string, string> = {
  Overview: "bg-primary/10 text-primary",
  Menu: "bg-warning/15 text-[hsl(32_90%_40%)] dark:text-warning",
  Business: "bg-info/10 text-info",
  Store: "bg-[hsl(262_70%_60%/0.12)] text-[hsl(262_60%_52%)]",
  Account: "bg-muted text-foreground",
};

function TabIcon({ icon: Icon, active, count = 0, dot }: { icon: LucideIcon; active: boolean; count?: number; dot?: boolean }) {
  return (
    <span className={cn("relative flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200", active ? "bg-accent text-primary" : "text-muted-foreground")}>
      <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.3 : 1.9} />
      {count > 0 && (
        <span className="tabular absolute -top-1 right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {count > 9 ? "9+" : count}
        </span>
      )}
      {dot && !count && <span className="absolute right-3 top-1 h-2 w-2 rounded-full border border-background bg-destructive" />}
    </span>
  );
}

function TabLabel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <span className={cn("text-[11px]", active ? "font-semibold text-primary" : "font-medium text-muted-foreground")}>{children}</span>;
}

function MobileNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const badges = useBadges();
  const { signOut, user } = useAuth();
  const { data: store } = useStore();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const inMenuOnly = !MOBILE_TABS.some((t) => (t.href === "/" ? pathname === "/" : pathname.startsWith(t.href)));
  const menuBadge = badges.notifications + badges.reviews;

  return (
    <>
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 shadow-[0_-4px_20px_-12px_hsl(var(--foreground)/0.15)] backdrop-blur lg:hidden" aria-label="Main">
        <div className="grid h-16 grid-cols-5 px-1">
          {MOBILE_TABS.slice(0, 1).map((tab) => (
            <NavLink key={tab.href} to={tab.href} end={tab.href === "/"} onClick={haptic.tap} className="flex flex-col items-center justify-center gap-0.5">
              {({ isActive }) => (
                <>
                  <TabIcon icon={tab.icon} active={isActive} count={tab.badge === "orders" ? badges.orders : 0} />
                  <TabLabel active={isActive}>{tab.title === "Dashboard" ? "Home" : tab.title}</TabLabel>
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={() => {
              haptic.tap();
              setMenuOpen(true);
            }}
            className="group flex flex-col items-center justify-center gap-0.5"
            aria-label="Open menu"
          >
            <TabIcon icon={Menu} active={inMenuOnly || menuOpen} dot={menuBadge > 0} />
            <TabLabel active={inMenuOnly || menuOpen}>Menu</TabLabel>
          </button>
          {MOBILE_TABS.slice(1).map((tab) => (
            <NavLink key={tab.href} to={tab.href} end={tab.href === "/"} onClick={haptic.tap} className="flex flex-col items-center justify-center gap-0.5">
              {({ isActive }) => (
                <>
                  <TabIcon icon={tab.icon} active={isActive} count={tab.badge === "orders" ? badges.orders : 0} />
                  <TabLabel active={isActive}>{tab.title === "Dashboard" ? "Home" : tab.title}</TabLabel>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
        <DrawerContent className="max-h-[88dvh] bg-muted/60">
          <DrawerTitle className="sr-only">Menu</DrawerTitle>
          <div className="pb-safe overflow-y-auto px-4 pt-2">
            <Link to="/store" className="mb-5 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-primary to-[hsl(190_70%_32%)] p-4 text-primary-foreground">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-base font-semibold">{store ? initials(store.store_name) : "…"}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{store?.store_name}</span>
                <span className="block truncate text-xs opacity-85">
                  {user?.full_name ?? store?.owner_name} · {user?.role ?? "Owner"}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 opacity-80" />
            </Link>
            <div className="space-y-4">
              {MENU_SECTIONS.map((section) => (
                <div key={section.label} className="rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border">
                  <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{section.label}</p>
                  <div className="grid grid-cols-4 gap-y-4">
                    {section.items.map((item) => {
                      const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                      const count = item.badge ? badges[item.badge] : 0;
                      return (
                        <Link key={item.href} to={item.href} onClick={haptic.tap} className="flex flex-col items-center gap-1.5 text-center">
                          <span
                            className={cn(
                              "relative flex h-[52px] w-[52px] items-center justify-center rounded-2xl transition-transform",
                              SECTION_TINT[section.label],
                              active && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                            )}
                          >
                            <item.icon className="h-6 w-6" />
                            {count > 0 && (
                              <span className="tabular absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                                {count > 9 ? "9+" : count}
                              </span>
                            )}
                          </span>
                          <span className={cn("text-[11px] leading-tight", active ? "font-semibold text-primary" : "font-medium")}>{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-4" />
            <Button variant="outline" className="mb-6 w-full text-destructive" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// ── New-order alert ─────────────────────────────────────────

function playChime() {
  try {
    const ctx = new AudioContext();
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.4);
    });
  } catch {
    /* audio blocked until the user interacts — ignore */
  }
}

function NewOrderWatcher() {
  const { data: counts } = useOrderCounts();
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  const previous = useRef<number | null>(null);

  useEffect(() => {
    if (counts === undefined) return;
    const now = counts.confirming;
    if (previous.current !== null && now > previous.current) {
      if (settings?.notifications.new_order_sound !== false) playChime();
      haptic.warning();
      toast.warning("New order received", {
        description: "A customer is waiting for you to accept.",
        action: { label: "View", onClick: () => navigate("/orders") },
        duration: 10_000,
      });
    }
    previous.current = now;
  }, [counts, settings, navigate]);

  useEffect(() => {
    const base = "Diyaar Store";
    document.title = counts?.confirming ? `(${counts.confirming}) New orders · ${base}` : base;
  }, [counts?.confirming]);

  return null;
}

// ── Shell ───────────────────────────────────────────────────

export function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => registerBackButton(() => navigate(-1), () => pathRef.current === "/"), [navigate]);

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pt-6">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <NewOrderWatcher />
    </div>
  );
}
