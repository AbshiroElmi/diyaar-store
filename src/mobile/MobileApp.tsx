import { useEffect, useRef, useState, type ReactNode } from "react";
import { Route, Routes, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { App as KonstaApp, Icon, List, ListItem, Tabbar, TabbarLink } from "konsta/react";
import { useTheme } from "next-themes";
import {
  Clock,
  FolderTree,
  GalleryHorizontal,
  LayoutGrid,
  LogOut,
  Menu as MenuIcon,
  Package,
  ReceiptText,
  Settings,
  Star,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useOrderCounts, useStore } from "@/hooks/queries";
import { haptic, registerBackButton } from "@/lib/native";
import { initials } from "@/lib/format";
import { orderSoundEnabled } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { IconTile, Sheet } from "./ui";
import HomeScreen from "./screens/Home";
import OrdersScreen from "./screens/Orders";
import OrderDetailScreen from "./screens/OrderDetail";
import ProductsScreen from "./screens/Products";
import ProductEditScreen from "./screens/ProductEdit";
import EarningsScreen from "./screens/Earnings";
import ReviewsScreen from "./screens/Reviews";
import CategoriesScreen from "./screens/Categories";
import BannersScreen from "./screens/Banners";
import StoreProfileScreen from "./screens/StoreProfile";
import HoursScreen from "./screens/Hours";
import TeamScreen from "./screens/Team";
import SettingsScreen from "./screens/Settings";

/** iOS styling on every platform, Android included, so both apps look the same. `?theme=material` forces Material for testing. */
const forced = (() => {
  const fromUrl = new URLSearchParams(window.location.search).get("theme");
  try {
    if (fromUrl) sessionStorage.setItem("portal_theme", fromUrl);
    return fromUrl ?? sessionStorage.getItem("portal_theme");
  } catch {
    return fromUrl;
  }
})();
export const mobileTheme: "ios" | "material" = forced === "material" ? "material" : "ios";

const TABS = [
  { href: "/", label: "Home", icon: LayoutGrid },
  { href: "/orders", label: "Orders", icon: ReceiptText },
  { href: "/products", label: "Products", icon: Package },
  { href: "/earnings", label: "Earnings", icon: Wallet },
];
const TAB_ROOTS = TABS.map((t) => t.href);
/** Bottom bar order. "menu" opens the sheet with every page that isn't a tab. */
const TAB_ORDER = ["/", "menu", "/orders", "/products", "/earnings"] as const;

interface MenuEntry {
  href: string;
  label: string;
  icon: LucideIcon;
  tint: string;
}

const MENU: Array<{ title: string; items: MenuEntry[] }> = [
  {
    title: "Menu",
    items: [
      { href: "/categories", label: "Categories", icon: FolderTree, tint: "bg-[#5856d6]" },
      { href: "/banners", label: "Home banners", icon: GalleryHorizontal, tint: "bg-[#34c759]" },
    ],
  },
  {
    title: "Store",
    items: [
      { href: "/reviews", label: "Reviews", icon: Star, tint: "bg-[#ff9500]" },
      { href: "/store", label: "Store Profile", icon: Store, tint: "bg-[#219186]" },
      { href: "/hours", label: "Opening Hours", icon: Clock, tint: "bg-[#34c759]" },
      { href: "/team", label: "Team", icon: Users, tint: "bg-[#5ac8fa]" },
    ],
  },
  {
    title: "Account",
    items: [{ href: "/settings", label: "Settings", icon: Settings, tint: "bg-[#8e8e93]" }],
  },
];

// ── Animated page stack ─────────────────────────────────────

const isTabRoot = (path: string) => TAB_ROOTS.includes(path);

function PageStack({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navType = useNavigationType();
  const prevPath = useRef(location.pathname);
  const isTabSwitch = isTabRoot(location.pathname) && isTabRoot(prevPath.current);
  const direction = navType === "POP" ? -1 : 1;

  useEffect(() => {
    prevPath.current = location.pathname;
  }, [location.pathname]);

  const variants = isTabSwitch
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : mobileTheme === "ios"
      ? {
          initial: { x: direction > 0 ? "100%" : "-30%", opacity: direction > 0 ? 1 : 0.6 },
          animate: { x: 0, opacity: 1 },
          exit: { x: direction > 0 ? "-30%" : "100%", opacity: direction > 0 ? 0.6 : 1, zIndex: direction > 0 ? 0 : 2 },
        }
      : {
          initial: { y: direction > 0 ? 48 : 0, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { opacity: 0 },
        };

  return (
    <AnimatePresence initial={false} mode="sync">
      <motion.div
        key={location.pathname}
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={isTabSwitch ? { duration: 0.15 } : { type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.38 }}
      >
        <Routes location={location}>{children}</Routes>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Menu sheet ──────────────────────────────────────────────

function MenuSheet({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: store } = useStore();

  const go = (href: string) => {
    haptic.tap();
    onClose();
    navigate(href);
  };

  // Swipe-to-dismiss: track drag on the handle pill only
  const dragStart = useRef<number | null>(null);
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    if (e.clientY - dragStart.current > 60) {
      dragStart.current = null;
      haptic.tap();
      onClose();
    }
  };
  const handlePointerUp = () => { dragStart.current = null; };

  // Close on any tap outside the sheet panel
  const sheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!opened) return;
    const handler = (e: TouchEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // 50 ms delay so the tap that opened the sheet doesn't immediately close it
    const timer = setTimeout(() => document.addEventListener("touchstart", handler, { passive: true }), 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("touchstart", handler);
    };
  }, [opened, onClose]);

  return (
    <Sheet opened={opened} onBackdropClick={onClose} className="max-h-[90dvh] w-full overflow-hidden rounded-t-[22px] pb-safe">
      <div ref={sheetRef}>
      <div
        className="flex justify-center pt-2.5 pb-2 cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <span className="h-[5px] w-10 rounded-full bg-black/15 dark:bg-white/20" />
      </div>
      <div className="no-scrollbar max-h-[calc(90dvh-20px)] overflow-y-auto pb-6">
        <List
          strong
          inset
          dividers
          className="!mt-4 !mb-2"
          // light teal card so the store stands out from the menu rows
          colors={{ strongBgIos: "bg-[#219186]/10 dark:bg-[#3fd0bd]/15", strongBgMaterial: "bg-[#219186]/10 dark:bg-[#3fd0bd]/15" }}
        >
          <ListItem
            link
            chevron
            onClick={() => go("/store")}
            media={<span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#2bb5a7] to-[#1b6f67] text-[17px] font-semibold text-white">{store ? initials(store.store_name) : ""}</span>}
            title={<span className="font-semibold">{store?.store_name ?? "My store"}</span>}
            text={`${user?.full_name ?? store?.owner_name ?? ""} · ${user?.role ?? "Owner"}`}
          />
        </List>
        {MENU.map((group) => (
          <div key={group.title}>
            <p className="px-8 pb-1.5 pt-4 text-[13px] uppercase text-black/45 dark:text-white/45">{group.title}</p>
            <List strong inset dividers className="!my-0">
              {group.items.map((item) => (
                <ListItem key={item.href} link chevron onClick={() => go(item.href)} media={<IconTile icon={item.icon} className={item.tint} />} title={item.label} />
              ))}
            </List>
          </div>
        ))}
        <List strong inset className="!mt-6">
          <ListItem
            link
            onClick={() => {
              onClose();
              signOut();
            }}
            title={
              <span className="flex items-center gap-2 text-[#ff3b30]">
                <LogOut className="h-[18px] w-[18px]" /> Sign out
              </span>
            }
          />
        </List>
      </div>
      </div>
    </Sheet>
  );
}

// ── New-order alert ─────────────────────────────────────────

function NewOrderAlert() {
  const { data: counts } = useOrderCounts();
  const navigate = useNavigate();
  const previous = useRef<number | null>(null);

  useEffect(() => {
    if (!counts) return;
    if (previous.current !== null && counts.confirming > previous.current) {
      haptic.warning();
      if (orderSoundEnabled()) {
        try {
          const ctx = new AudioContext();
          [880, 1175].forEach((f, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.frequency.value = f;
            g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
            g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.35);
            o.connect(g).connect(ctx.destination);
            o.start(ctx.currentTime + i * 0.18);
            o.stop(ctx.currentTime + i * 0.18 + 0.4);
          });
        } catch {
          /* audio not available */
        }
      }
      toast.warning("New order 🛎️", { description: "Waiting for you to accept", action: { label: "View", onClick: () => navigate("/orders") }, duration: 6000 });
    }
    previous.current = counts.confirming;
  }, [counts, navigate]);

  return null;
}

// ── Sticky "new orders" bar (like Blinkit's cart bar) ───────

function NewOrdersBar({ count, visible }: { count: number; visible: boolean }) {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      {visible && count > 0 && (
        <motion.button
          key="new-orders-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          onClick={() => {
            haptic.press();
            navigate("/orders?status=confirming");
          }}
          className={cn(
            "hide-on-kb fixed inset-x-3 z-30 flex items-center gap-3 rounded-xl bg-[#219186] px-4 py-3 text-left text-white shadow-[0_10px_30px_-10px_rgba(33,145,134,0.7)] active:scale-[0.98]",
            mobileTheme === "ios" ? "bottom-[calc(env(safe-area-inset-bottom)+62px)]" : "bottom-[calc(env(safe-area-inset-bottom)+90px)]",
          )}
        >
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <ReceiptText className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 animate-bounce items-center justify-center rounded-full bg-[#BEFF00] px-1 text-[11px] font-extrabold text-[#2B330F]">{count}</span>
          </span>
          <span className="flex-1 leading-tight">
            <span className="block text-[15px] font-extrabold">
              {count} new order{count > 1 ? "s" : ""}
            </span>
            <span className="block text-[12px] font-medium text-white/80">Customers are waiting</span>
          </span>
          <span className="flex items-center gap-1 text-[15px] font-extrabold">
            Accept <span aria-hidden>→</span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ── Shell ───────────────────────────────────────────────────

export default function MobileApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: counts } = useOrderCounts();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  useEffect(() => registerBackButton(() => (menuOpen ? setMenuOpen(false) : navigate(-1)), () => pathRef.current === "/"), [navigate, menuOpen]);
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Tab bar shows on tab roots and on screens opened from the menu; detail/edit screens hide it.
  const depth = location.pathname.split("/").filter(Boolean).length;
  const showTabbar = depth <= 1;
  const activeTab = TABS.find((t) => (t.href === "/" ? location.pathname === "/" : location.pathname === t.href))?.href;

  return (
    <KonstaApp theme={mobileTheme} dark={resolvedTheme === "dark"} safeAreas className="k-portal">
      <PageStack>
        <Route index element={<HomeScreen />} />
        <Route path="orders" element={<OrdersScreen />} />
        <Route path="orders/:id" element={<OrderDetailScreen />} />
        <Route path="products" element={<ProductsScreen />} />
        <Route path="products/new" element={<ProductEditScreen />} />
        <Route path="products/:id" element={<ProductEditScreen />} />
        <Route path="earnings" element={<EarningsScreen />} />
        <Route path="reviews" element={<ReviewsScreen />} />
        <Route path="categories" element={<CategoriesScreen />} />
        <Route path="banners" element={<BannersScreen />} />
        <Route path="store" element={<StoreProfileScreen />} />
        <Route path="hours" element={<HoursScreen />} />
        <Route path="team" element={<TeamScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="*" element={<HomeScreen />} />
      </PageStack>

      <Tabbar
        labels
        icons
        className={cn("hide-on-kb fixed bottom-0 left-0 z-20 transition-[transform,opacity] duration-300", !showTabbar && "translate-y-full")}
      >
        {TAB_ORDER.map((key) => {
          if (key === "menu") {
            return (
              <TabbarLink
                key="menu"
                active={menuOpen || (!activeTab && showTabbar)}
                onClick={() => {
                  haptic.tap();
                  setMenuOpen(true);
                }}
                icon={
                  <span className="relative inline-flex">
                    <MenuIcon className={mobileTheme === "ios" ? "h-7 w-7" : "h-6 w-6"} />
                  </span>
                }
                label="Menu"
              />
            );
          }
          const tab = TABS.find((t) => t.href === key)!;
          const count = tab.href === "/orders" ? counts?.confirming : 0;
          return (
            <TabbarLink
              key={tab.href}
              active={!menuOpen && activeTab === tab.href}
              onClick={() => {
                haptic.tap();
                if (location.pathname !== tab.href) navigate(tab.href, { replace: isTabRoot(location.pathname) });
              }}
              icon={<Icon ios={<tab.icon className="h-7 w-7" />} material={<tab.icon className="h-6 w-6" />} badge={count ? String(count) : undefined} badgeColors={{ bg: "bg-[#ff3b30]" }} />}
              label={tab.label}
            />
          );
        })}
      </Tabbar>

      <NewOrdersBar count={counts?.confirming ?? 0} visible={location.pathname === "/" && !menuOpen} />
      <MenuSheet opened={menuOpen} onClose={() => setMenuOpen(false)} />
      <NewOrderAlert />
    </KonstaApp>
  );
}
