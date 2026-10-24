import {
  BarChart3,
  Bell,
  Clock,
  FolderTree,
  Headphones,
  LayoutDashboard,
  Megaphone,
  Package,
  ReceiptText,
  Settings,
  Star,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Key used to show a live counter next to the item. */
  badge?: "orders" | "reviews" | "notifications";
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard, description: "Today at a glance" },
      { title: "Orders", href: "/orders", icon: ReceiptText, description: "Accept and prepare orders", badge: "orders" },
    ],
  },
  {
    label: "Menu",
    items: [
      { title: "Products", href: "/products", icon: Package, description: "Items, prices and stock" },
      { title: "Categories", href: "/categories", icon: FolderTree, description: "Organise your menu" },
    ],
  },
  {
    label: "Business",
    items: [
      { title: "Earnings", href: "/earnings", icon: Wallet, description: "Balance and payouts" },
      { title: "Reports", href: "/reports", icon: BarChart3, description: "Sales and trends" },
      { title: "Reviews", href: "/reviews", icon: Star, description: "Ratings and replies", badge: "reviews" },
      { title: "Promotions", href: "/promotions", icon: Megaphone, description: "Discounts and codes" },
    ],
  },
  {
    label: "Store",
    items: [
      { title: "Store Profile", href: "/store", icon: Store, description: "Info, delivery and fees" },
      { title: "Opening Hours", href: "/hours", icon: Clock, description: "Weekly schedule" },
      { title: "Team", href: "/team", icon: Users, description: "Staff and roles" },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Notifications", href: "/notifications", icon: Bell, description: "Alerts and updates", badge: "notifications" },
      { title: "Support", href: "/support", icon: Headphones, description: "Get help from Diyaar" },
      { title: "Settings", href: "/settings", icon: Settings, description: "Preferences" },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

const byHref = (href: string) => ALL_NAV_ITEMS.find((i) => i.href === href)!;

/** Mobile bottom bar: "Menu" opens a sheet; these four sit next to it. */
export const MOBILE_TABS: NavItem[] = [byHref("/"), byHref("/orders"), byHref("/products"), byHref("/earnings")];

export function findNavItem(pathname: string) {
  if (pathname === "/") return byHref("/");
  return ALL_NAV_ITEMS.filter((i) => i.href !== "/").find((i) => pathname.startsWith(i.href));
}
