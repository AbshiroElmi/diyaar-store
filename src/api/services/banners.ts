/**
 * Banners and promotions are run by Diyaar. The store app shows the same ones
 * customers see, read-only: a store can't create or change them.
 */

import { api, fileUrl } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { Banner, Promotion, PromotionType } from "../types";

interface BannerRow {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  image_mobile: string;
  display_mode: string;
  background_type: string;
  background_color: string;
  background_color_end: string;
  store?: { id: string; name: string; logo: string };
}

interface PromotionRow {
  name: string;
  code: string;
  title: string;
  description: string | null;
  discount_type: PromotionType;
  discount_value: number;
  max_discount: number | null;
  min_order: number | null;
  banner_image: string | null;
  valid_until: string | null;
}

function background(b: BannerRow) {
  if (b.background_type === "image" || !b.background_color) return undefined;
  return b.background_color_end ? `linear-gradient(135deg, ${b.background_color}, ${b.background_color_end})` : b.background_color;
}

export const bannersService = {
  /** The banners on the customer app's Home screen. */
  list: async (): Promise<Banner[]> => {
    const r = await api.get<{ banners: BannerRow[] }>(ENDPOINTS.getBanners, { screen: "home" });
    return r.banners.map((b) => ({
      name: b.id,
      title: b.title,
      subtitle: b.subtitle,
      image: fileUrl(b.image_mobile || b.image),
      display_mode: b.display_mode,
      background: background(b),
      store: b.store && { id: b.store.id, name: b.store.name, logo: fileUrl(b.store.logo) },
    }));
  },
};

export const promotionsService = {
  /** Diyaar's live offers that customers can see in the app. */
  list: async (): Promise<Promotion[]> => {
    const r = await api.get<{ promotions: PromotionRow[] }>(ENDPOINTS.getPromotions);
    return r.promotions.map((p) => ({
      name: p.name,
      title: p.title,
      description: p.description ?? "",
      type: p.discount_type,
      value: p.discount_value,
      // Without a linked code the backend falls back to the campaign ID, which customers can't type.
      code: p.code && p.code !== p.name ? p.code : undefined,
      min_order: p.min_order ?? undefined,
      max_discount: p.max_discount ?? undefined,
      image: fileUrl(p.banner_image),
      valid_until: p.valid_until ?? undefined,
    }));
  },
};
