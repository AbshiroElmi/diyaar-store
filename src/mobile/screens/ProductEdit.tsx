import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, Check, ChevronDown, Trash2 } from "lucide-react";
import { ActionsGroup, ActionsLabel, BlockFooter, BlockTitle, Link as KLink, List, ListInput, ListItem, Toggle } from "konsta/react";
import { PRODUCT_TAGS, type ProductLocation, type ProductTag } from "@/api";
import { useCategories, useDeleteProduct, useProductLocations, useProducts, useSaveProduct } from "@/hooks/queries";
import { haptic } from "@/lib/native";
import { readPhoto } from "@/lib/photo";
import { cn } from "@/lib/utils";
import { locationError, percentOff, priceFromPercent, ProductLocations, type LocationDefaults } from "../ProductLocations";
import { ActionItem, Actions, Loading, ProductArt, Screen, Sheet } from "../ui";

interface Form {
  product_name: string;
  description: string;
  /** Category ID; the categories themselves are managed on the Diyaar web panel. */
  category: string;
  sku: string;
  tag: ProductTag | "";
  price: string;
  discount_price: string;
  is_available: boolean;
  /** Off for an item that never runs out; then there's no quantity. */
  track_stock: boolean;
  stock: string;
  image: string;
}

const LOW_STOCK_AT = 5;

export default function ProductEditScreen() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts(isNew ? {} : { search: id });
  const product = products?.data.find((p) => p.name === id);
  const save = useSaveProduct();
  const remove = useDeleteProduct();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [pickingCategory, setPickingCategory] = useState(false);
  const [percentDraft, setPercentDraft] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: savedLocations, isLoading: loadingLocations, error: locationsError } = useProductLocations(id);
  const [locations, setLocations] = useState<ProductLocation[] | null>(null);

  useEffect(() => {
    if (form) return;
    if (isNew && categories) {
      setForm({ product_name: "", description: "", category: categories[0]?.name ?? "", sku: "", tag: "", price: "", discount_price: "", is_available: true, track_stock: true, stock: "", image: "" });
    } else if (product) {
      setForm({
        product_name: product.product_name,
        description: product.description,
        category: product.category,
        sku: product.sku,
        tag: (product.tags.find((t) => t in PRODUCT_TAGS) as ProductTag | undefined) ?? "",
        price: String(product.price),
        discount_price: product.discount_price ? String(product.discount_price) : "",
        is_available: !!product.is_available,
        track_stock: !!product.is_stock_item,
        stock: product.stock_quantity ? String(product.stock_quantity) : "",
        image: product.image ?? "",
      });
    }
  }, [isNew, categories, product, form]);

  useEffect(() => {
    if (savedLocations && !locations) setLocations(savedLocations);
  }, [savedLocations, locations]);

  const categoryName = categories?.find((c) => c.name === form?.category)?.category_name ?? "";
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const priceNumber = Number(form?.price) || 0;
  const discountNumber = Number(form?.discount_price) || 0;
  const percent = percentOff(priceNumber, discountNumber);
  const locationDefaults: LocationDefaults = { price: priceNumber, discount: percent ? discountNumber : 0, tracksStock: !!form?.track_stock, stock: Number(form?.stock) || 0 };
  const onPercent = (text: string) => {
    setPercentDraft(text);
    const value = Number(text);
    set("discount_price", !text.trim() || !(value > 0) || !priceNumber ? "" : String(priceFromPercent(priceNumber, Math.min(value, 99))));
  };

  const submit = () => {
    if (!form) return;
    const price = Number(form.price);
    const discount = form.discount_price ? Number(form.discount_price) : undefined;
    const stock = form.track_stock && form.stock.trim() ? Number(form.stock) : 0;
    if (!form.product_name.trim()) return setError("Enter a product name");
    if (!form.category) return setError("Choose a category. Categories are added on the Diyaar web panel.");
    if (!(price > 0)) return setError("Enter a price above 0");
    if (discount !== undefined && !(discount > 0 && discount < price)) return setError("Discount price must be lower than the price");
    if (!Number.isInteger(stock) || stock < 0) return setError("Quantity must be a whole number");
    const badLocation = locations?.find((l) => locationError(l, locationDefaults));
    if (badLocation) return setError(`${badLocation.location_name}: ${locationError(badLocation, locationDefaults)}`);
    setError(null);
    save.mutate(
      {
        id,
        data: {
          product_name: form.product_name.trim(),
          description: form.description.trim(),
          category: form.category,
          sku: form.sku.trim(),
          tags: form.tag ? [form.tag] : [],
          price,
          discount_price: discount ?? null,
          is_available: form.is_available ? 1 : 0,
          is_stock_item: form.track_stock ? 1 : 0,
          // 0 clears it; the backend skips blanks.
          stock_quantity: stock,
          image: form.image || null,
        },
        locations: locations ?? undefined,
      },
      { onSuccess: () => navigate(-1) },
    );
  };

  const saveLink = (
    <KLink navbar onClick={submit} className="font-semibold">
      {save.isPending ? "Saving…" : isNew ? "Add" : "Save"}
    </KLink>
  );

  return (
    <Screen title={isNew ? "New product" : "Edit product"} back right={saveLink}>
      {!form || (isLoading && !isNew) ? (
        <Loading />
      ) : (
        <>
          <div className="flex flex-col items-center pt-5">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  set("image", await readPhoto(file));
                  haptic.tap();
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            />
            <button type="button" onClick={() => fileRef.current?.click()} className="relative transition-transform active:scale-95">
              <ProductArt category={categoryName} image={form.image || undefined} className="h-24 w-24 rounded-3xl shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]" emojiClassName="text-[52px]" />
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-[#f7f9f9] dark:ring-black">
                <Camera className="h-4 w-4" />
              </span>
            </button>
            <div className="mt-2 flex items-center gap-3 text-[13px] font-semibold">
              <button type="button" onClick={() => fileRef.current?.click()} className="text-primary">
                {form.image ? "Change photo" : "Add photo"}
              </button>
              {form.image && (
                <button type="button" onClick={() => set("image", "")} className="text-[#ff3b30]">
                  Remove
                </button>
              )}
            </div>
          </div>

          <List strongIos insetIos>
            <ListInput label="Name" type="text" placeholder="e.g. Chicken Shawarma" value={form.product_name} onInput={(e: React.ChangeEvent<HTMLInputElement>) => set("product_name", e.target.value)} />
            <ListInput label="Description" type="textarea" placeholder="What's in it?" inputClassName="!h-20 resize-none" value={form.description} onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => set("description", e.target.value)} />
            <ListItem
              link
              chevron={false}
              onClick={() => {
                haptic.tap();
                setPickingCategory(true);
              }}
              media={<ProductArt category={categoryName} image={categories?.find((c) => c.name === form.category)?.image} className="h-9 w-9 rounded-xl" emojiClassName="text-[20px]" />}
              header="Category"
              title={categoryName || "Choose a category"}
              after={<ChevronDown className="h-5 w-5 text-black/35 dark:text-white/35" />}
            />
            <ListInput label="SKU" type="text" placeholder="Optional, e.g. PIZ-001" value={form.sku} onInput={(e: React.ChangeEvent<HTMLInputElement>) => set("sku", e.target.value)} />
          </List>
          <BlockFooter>Connected apps match their items to this product by SKU.</BlockFooter>

          <BlockTitle>Tag</BlockTitle>
          {/* my-8 like a Konsta List, which BlockTitle and BlockFooter overlap into. */}
          <div className="my-8 flex flex-wrap gap-2 px-4">
            {(Object.keys(PRODUCT_TAGS) as ProductTag[]).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  haptic.tap();
                  set("tag", form.tag === tag ? "" : tag);
                }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[14px] font-semibold transition-transform active:scale-95",
                  form.tag === tag ? "bg-primary text-primary-foreground" : "bg-white text-black/70 dark:bg-[#1c1c1d] dark:text-white/75",
                )}
              >
                {PRODUCT_TAGS[tag]}
              </button>
            ))}
          </div>
          <BlockFooter>Pick one tag to show on the product, or none. New also shows by itself for 7 days after the product is added.</BlockFooter>

          <BlockTitle>Price</BlockTitle>
          <List strongIos insetIos>
            <ListInput label="Price ($)" type="text" inputMode="decimal" placeholder="0.00" value={form.price} onInput={(e: React.ChangeEvent<HTMLInputElement>) => set("price", e.target.value)} />
            <ListInput
              label="Discount price ($)"
              type="text"
              inputMode="decimal"
              placeholder="None"
              value={form.discount_price}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                setPercentDraft(null);
                set("discount_price", e.target.value);
              }}
            />
            <ListInput
              label="% off"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={percentDraft ?? (percent ? String(percent) : "")}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) => onPercent(e.target.value)}
              onBlur={() => setPercentDraft(null)}
            />
          </List>
          <BlockFooter>The discount price replaces the price. Enter either one and the other fills in.</BlockFooter>

          <BlockTitle>Stock</BlockTitle>
          <List strong inset dividers>
            <ListItem title="Track inventory" after={<Toggle checked={form.track_stock} onChange={() => set("track_stock", !form.track_stock)} />} />
            {form.track_stock && (
              <ListInput label="Quantity" type="text" inputMode="numeric" placeholder="0" value={form.stock} onInput={(e: React.ChangeEvent<HTMLInputElement>) => set("stock", e.target.value.replace(/\D/g, ""))} />
            )}
            <ListItem title="Available for sale" after={<Toggle checked={form.is_available} onChange={() => set("is_available", !form.is_available)} />} />
          </List>
          <BlockFooter>
            {form.track_stock ? `Shown as low stock at ${LOW_STOCK_AT} or fewer, and sold out at 0. ` : "Without inventory it never runs out. "}
            Turn off “Available for sale” to hide it from customers.
          </BlockFooter>

          <BlockTitle>Locations</BlockTitle>
          {loadingLocations || locationsError || !locations?.length ? (
            <p className="my-8 px-8 text-sm text-black/45 dark:text-white/45">
              {loadingLocations ? "Loading locations…" : locationsError ? `Couldn't load your locations: ${locationsError.message}` : "Your store has no locations yet."}
            </p>
          ) : (
            <>
              <ProductLocations rows={locations} defaults={locationDefaults} onChange={setLocations} />
              <BlockFooter>Price, discount, availability and stock at each location. An empty price means the product's price.</BlockFooter>
            </>
          )}

          {error && <p className="px-8 text-[13px] text-[#ff3b30]">{error}</p>}
          {isNew && <p className="mb-8 mt-2 px-8 text-sm text-black/45 dark:text-white/45">New products may be reviewed by Diyaar before customers can see them.</p>}

          {!isNew && (
            <List strong inset className="!mt-8">
              <ListItem
                link
                chevron={false}
                onClick={() => setConfirmDelete(true)}
                title={
                  <span className="flex items-center gap-2 text-[#ff3b30]">
                    <Trash2 className="h-[18px] w-[18px]" /> Delete product
                  </span>
                }
              />
            </List>
          )}

          <Sheet opened={pickingCategory} onBackdropClick={() => setPickingCategory(false)} className="w-full rounded-t-[22px] pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-black/15 dark:bg-white/20" />
            <p className="px-5 pb-3 pt-3 text-center text-[17px] font-bold">Choose a category</p>
            {/* Long lists scroll inside the sheet; the title stays put. */}
            <div className="grid max-h-[65dvh] grid-cols-3 gap-2.5 overflow-y-auto overscroll-contain px-4 pb-2">
              {categories?.map((c) => {
                const selected = c.name === form.category;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      haptic.tap();
                      set("category", c.name);
                      setPickingCategory(false);
                    }}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 pb-3 transition-transform active:scale-95",
                      selected ? "border-primary bg-primary/5" : "border-transparent",
                    )}
                  >
                    <ProductArt category={c.category_name} image={c.image} className={cn("aspect-square w-full rounded-xl", !c.is_active && "opacity-50")} emojiClassName="text-[36px]" />
                    <span className="line-clamp-2 text-center text-[12px] font-bold leading-tight">{c.category_name}</span>
                    {!c.is_active && <span className="-mt-1 text-[10px] font-semibold text-black/40 dark:text-white/40">Hidden</span>}
                    {selected && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Sheet>

          <Actions opened={confirmDelete} onBackdropClick={() => setConfirmDelete(false)}>
            <ActionsGroup>
              <ActionsLabel>“{product?.product_name}” will be removed from your menu.</ActionsLabel>
              <ActionItem
                icon={Trash2}
                danger
                onClick={() => {
                  setConfirmDelete(false);
                  if (id) remove.mutate(id, { onSuccess: () => navigate(-1) });
                }}
              >
                Delete product
              </ActionItem>
            </ActionsGroup>
          </Actions>
        </>
      )}
    </Screen>
  );
}
