import { api, fileUrl, filePath } from "../client";
import { ENDPOINTS } from "../endpoints";
import { mapProduct } from "../map";
import type { Category, Paginated, Product, ProductInput, ProductListParams, ProductLocation } from "../types";
import { currentStore, storeService } from "./store";

/** A photo picked on the device is a data URL; upload it first and send the server's file path. */
async function imagePath(image?: string | null) {
  if (!image) return "";
  if (!image.startsWith("data:")) return filePath(image);
  const [head, data] = image.split(",");
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: head.match(/data:([^;]+)/)?.[1] ?? "image/jpeg" });
  return storeService.uploadImage(blob, `product-${Date.now()}.jpg`);
}

const body = async (data: Partial<ProductInput>) => ({
  ...data,
  ...(data.image !== undefined && { image: await imagePath(data.image) }),
  // The backend skips nulls, so 0 is how a sale price is cleared.
  ...(data.discount_price !== undefined && { discount_price: data.discount_price ?? 0 }),
});

export const productsService = {
  list: async (params: ProductListParams = {}): Promise<Paginated<Product>> => {
    const r = await api.get<{ data: Record<string, unknown>[]; total: number; page: number; page_size: number }>(ENDPOINTS.getProducts, {
      page_size: 100,
      ...params,
      status: params.status?.toLowerCase(),
    });
    return { data: r.data.map(mapProduct), total: r.total, page: r.page, page_size: r.page_size };
  },
  /** Returns whether the product is live straight away or waiting for Diyaar's review. */
  /** Returns the new product's ID and whether it's live straight away or waiting for Diyaar's review. */
  create: async ({ product_name, category, stock_quantity, ...rest }: ProductInput) => {
    const r = await api.post<{ product_id: string; data: { status: string } }>(ENDPOINTS.createProduct, {
      ...(await body(rest)),
      name: product_name,
      category_id: category,
      stock: stock_quantity,
    });
    return { id: r.product_id, pending: /pending/i.test(r.data.status) };
  },
  update: async (productId: string, data: Partial<ProductInput>) => {
    await api.post(ENDPOINTS.updateProduct, { product_id: productId, ...(await body(data)) });
    const r = await productsService.list({ search: productId, page_size: 5 });
    return r.data.find((p) => p.name === productId) ?? ({ name: productId, ...data } as Product);
  },
  remove: (productId: string) => api.post<{ success: boolean }>(ENDPOINTS.deleteProduct, { product_id: productId }),
};

interface LocationRow {
  location: string;
  location_name: string;
  override_price: number | null;
  override_discount_price: number | null;
  override_is_available: number;
  track_own_stock: number;
  override_stock_quantity: number | null;
}

export const productLocationsService = {
  /** The product at each active location of the store; a new product (no ID) starts from the store's locations. */
  list: async (productId?: string): Promise<ProductLocation[]> => {
    if (!productId) {
      const r = await api.get<{ locations: Array<{ name: string; location_name: string; is_active: number }> }>(ENDPOINTS.getStoreLocations, { store_id: currentStore.id });
      return r.locations
        .filter((l) => l.is_active)
        .map((l) => ({ location: l.name, location_name: l.location_name, price: null, discount_price: null, is_available: true, track_own_stock: false, stock_quantity: null }));
    }
    const r = await api.get<{ locations: LocationRow[] }>(ENDPOINTS.getProductLocations, { product_id: productId });
    return r.locations.map((l) => ({
      location: l.location,
      location_name: l.location_name,
      price: l.override_price,
      discount_price: l.override_discount_price,
      is_available: !!l.override_is_available,
      track_own_stock: !!l.track_own_stock,
      stock_quantity: l.override_stock_quantity,
    }));
  },
  /** A row back at the product's defaults removes the location's own values. Stock is only sent for a product that tracks it. */
  save: (productId: string, rows: ProductLocation[], tracksStock: boolean) =>
    api.post(ENDPOINTS.setProductLocations, {
      product_id: productId,
      overrides: rows.map((l) => ({
        location: l.location,
        price: l.price,
        discount_price: l.discount_price,
        is_available: l.is_available ? 1 : 0,
        ...(tracksStock && { track_own_stock: l.track_own_stock ? 1 : 0, stock_quantity: l.track_own_stock ? (l.stock_quantity ?? 0) : 0 }),
      })),
    }),
};

interface CategoryNode {
  id: string;
  name: string;
  image?: string;
  status: string;
  productCount: number;
  children: CategoryNode[];
}

export const categoriesService = {
  /**
   * The categories of the store's service module, flattened, each marked with whether the store uses it.
   * They're managed on the Diyaar web panel.
   */
  list: async (): Promise<Category[]> => {
    const [r, used] = await Promise.all([
      api.get<{ categories: CategoryNode[] }>(ENDPOINTS.getCategories),
      // The same "categories in use" list the web panel's category filter shows.
      api.get<{ facets?: { categories: Array<{ value: string }> } }>(ENDPOINTS.getProducts, { page_size: 1, include_facets: 1 }),
    ]);
    // Products store the category's name (older ones may store its ID).
    const inStore = new Set(used.facets?.categories.map((c) => c.value) ?? []);
    const flat: Category[] = [];
    const walk = (nodes: CategoryNode[]) =>
      nodes.forEach((c) => {
        flat.push({
          name: c.id,
          category_name: c.name,
          image: fileUrl(c.image),
          is_active: c.status === "Active" ? 1 : 0,
          product_count: c.productCount || 0,
          in_store: inStore.has(c.name) || inStore.has(c.id),
        });
        walk(c.children ?? []);
      });
    walk(r.categories);
    return flat;
  },
};
