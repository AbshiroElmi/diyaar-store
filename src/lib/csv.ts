import { Directory, Filesystem, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { Category, Product, ProductInput } from "@/api";
import { isNative } from "./native";

// ── Generic CSV ─────────────────────────────────────────────

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows: unknown[][]) => rows.map((r) => r.map(cell).join(",")).join("\r\n");

/** RFC 4180-ish parser: quoted fields, escaped quotes, CRLF/LF, BOM. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') (field += '"'), i++;
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") row.push(field), (field = "");
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field), rows.push(row), (row = []), (field = "");
    } else field += ch;
  }
  if (field || row.length) row.push(field), rows.push(row);
  return rows.filter((r) => r.some((c) => c.trim()));
}

/** Save a CSV: share sheet on the phone, a download in the browser. */
export async function saveCsv(filename: string, csv: string) {
  if (isNative) {
    const { uri } = await Filesystem.writeFile({ path: filename, data: "﻿" + csv, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: filename, files: [uri] });
    return;
  }
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Menu items ──────────────────────────────────────────────

const HEADERS = ["name", "description", "category", "price", "sale_price", "prep_time", "in_stock", "popular"] as const;

const yes = (v: string) => /^(1|y|yes|true)$/i.test(v.trim());

export const productsToCsv = (products: Product[]) =>
  toCsv([
    [...HEADERS],
    ...products.map((p) => [p.product_name, p.description, p.category, p.price, p.discount_price ?? "", p.preparation_time ?? "", p.is_available ? "yes" : "no", p.is_popular ? "yes" : "no"]),
  ]);

export const productTemplateCsv = (categories: Category[]) =>
  toCsv([
    [...HEADERS],
    ["Chicken Shawarma", "Grilled chicken, garlic sauce, pickles", categories[0]?.category_name ?? "Grills", 8.5, "", 15, "yes", "no"],
  ]);

export interface ImportRow {
  line: number;
  data?: ProductInput;
  /** The row's category doesn't exist yet and will be created on import. */
  newCategory?: boolean;
  error?: string;
}

/** Turn CSV text into validated product rows; bad rows carry an error instead of data. */
export function readProductsCsv(text: string, categories: Category[]): ImportRow[] {
  const [head, ...body] = parseCsv(text);
  if (!head) throw new Error("The file is empty");
  const col = Object.fromEntries(head.map((h, i) => [h.trim().toLowerCase().replace(/\s+/g, "_"), i]));
  for (const h of ["name", "category", "price"]) if (col[h] === undefined) throw new Error(`Missing “${h}” column`);
  const get = (r: string[], h: string) => (col[h] === undefined ? "" : (r[col[h]] ?? "").trim());
  const byName = new Map(categories.map((c) => [c.category_name.toLowerCase(), c.category_name]));

  return body.map((r, i) => {
    const line = i + 2;
    const name = get(r, "name");
    const rawCategory = get(r, "category");
    const category = byName.get(rawCategory.toLowerCase()) ?? rawCategory;
    const price = Number(get(r, "price"));
    const sale = get(r, "sale_price") ? Number(get(r, "sale_price")) : undefined;
    const prep = get(r, "prep_time") ? Number(get(r, "prep_time")) : undefined;
    if (!name) return { line, error: "Name is empty" };
    if (!category) return { line, error: "Category is empty" };
    if (!(price > 0)) return { line, error: "Price must be above 0" };
    if (sale !== undefined && !(sale > 0 && sale < price)) return { line, error: "Sale price must be lower than price" };
    if (prep !== undefined && !(prep >= 0)) return { line, error: "Prep time must be a number" };
    return {
      line,
      newCategory: !byName.has(category.toLowerCase()),
      data: {
        product_name: name,
        description: get(r, "description"),
        category,
        price,
        discount_price: sale,
        preparation_time: prep,
        is_available: get(r, "in_stock") ? (yes(get(r, "in_stock")) ? 1 : 0) : 1,
        is_popular: yes(get(r, "popular")) ? 1 : 0,
      },
    };
  });
}

// ── Categories ──────────────────────────────────────────────

const CATEGORY_HEADERS = ["name", "description", "visible"] as const;

export interface CategoryImportRow {
  line: number;
  data?: { category_name: string; description: string; is_active: 0 | 1 };
  error?: string;
}

export const categoriesToCsv = (categories: Category[]) =>
  toCsv([[...CATEGORY_HEADERS], ...categories.map((c) => [c.category_name, c.description ?? "", c.is_active ? "yes" : "no"])]);

export const categoryTemplateCsv = () =>
  toCsv([
    [...CATEGORY_HEADERS],
    ["Breakfast", "Served until 11am", "yes"],
    ["Fresh Juices", "", "yes"],
  ]);

/** Validate category rows; names already on the menu (or repeated in the file) are skipped. */
export function readCategoriesCsv(text: string, existing: Category[]): CategoryImportRow[] {
  const [head, ...body] = parseCsv(text);
  if (!head) throw new Error("The file is empty");
  const col = Object.fromEntries(head.map((h, i) => [h.trim().toLowerCase().replace(/\s+/g, "_"), i]));
  const nameCol = col.name ?? col.category ?? col.category_name;
  if (nameCol === undefined) throw new Error("Missing “name” column");
  const get = (r: string[], i: number | undefined) => (i === undefined ? "" : (r[i] ?? "").trim());
  const seen = new Set(existing.map((c) => c.category_name.toLowerCase()));

  return body.map((r, i) => {
    const line = i + 2;
    const name = get(r, nameCol);
    if (!name) return { line, error: "Name is empty" };
    if (seen.has(name.toLowerCase())) return { line, error: `“${name}” already exists` };
    seen.add(name.toLowerCase());
    const visible = get(r, col.visible);
    return { line, data: { category_name: name, description: get(r, col.description), is_active: visible && !yes(visible) ? 0 : 1 } };
  });
}
