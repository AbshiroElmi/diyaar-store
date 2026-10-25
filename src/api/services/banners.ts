/**
 * Home banners are saved on this phone until Diyaar adds a banners API.
 * The shape matches what an API would return, so only this file changes then.
 */

import type { Banner } from "../types";

const KEY = "portal_banners";

function read(): Banner[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(banners: Banner[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(banners));
  } catch {
    throw new Error("Not enough space on this phone — use smaller photos or remove a banner");
  }
}

const sorted = (banners: Banner[]) => [...banners].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

export const bannersService = {
  list: async () => sorted(read()),
  create: async (data: Omit<Banner, "name">) => {
    const all = read();
    const banner: Banner = { sort_order: all.length, ...data, name: `BN-${Date.now()}` };
    write([...all, banner]);
    return banner;
  },
  update: async (bannerId: string, data: Partial<Banner>) => {
    const all = read().map((b) => (b.name === bannerId ? { ...b, ...data, name: bannerId } : b));
    write(all);
    return all.find((b) => b.name === bannerId)!;
  },
  remove: async (bannerId: string) => write(read().filter((b) => b.name !== bannerId)),
};
