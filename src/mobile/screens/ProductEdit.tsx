import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, Check, ChevronDown, Trash2 } from "lucide-react";
import { Actions, ActionsButton, ActionsGroup, ActionsLabel, BlockFooter, BlockTitle, Link as KLink, List, ListInput, ListItem, Sheet, Toggle } from "konsta/react";
import { useCategories, useDeleteProduct, useProducts, useSaveProduct } from "@/hooks/queries";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";
import { categoryLook, Loading, ProductArt, Screen } from "../ui";

/** Shrink a picked photo to a square-ish JPEG so it stays light to store and upload. */
function readPhoto(file: File, max = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that photo"));
    };
    img.src = url;
  });
}

interface Form {
  product_name: string;
  description: string;
  category: string;
  price: string;
  discount_price: string;
  preparation_time: string;
  is_available: boolean;
  is_popular: boolean;
  image: string;
}

export default function ProductEditScreen() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts();
  const product = products?.data.find((p) => p.name === id);
  const save = useSaveProduct();
  const remove = useDeleteProduct();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [pickingCategory, setPickingCategory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (form) return;
    if (isNew && categories) {
      setForm({ product_name: "", description: "", category: categories[0]?.category_name ?? "", price: "", discount_price: "", preparation_time: "", is_available: true, is_popular: false, image: "" });
    } else if (product) {
      setForm({
        product_name: product.product_name,
        description: product.description,
        category: product.category,
        price: String(product.price),
        discount_price: product.discount_price ? String(product.discount_price) : "",
        preparation_time: product.preparation_time ? String(product.preparation_time) : "",
        is_available: !!product.is_available,
        is_popular: !!product.is_popular,
        image: product.image ?? "",
      });
    }
  }, [isNew, categories, product, form]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const submit = () => {
    if (!form) return;
    const price = Number(form.price);
    const discount = form.discount_price ? Number(form.discount_price) : undefined;
    if (!form.product_name.trim()) return setError("Enter a product name");
    if (!(price > 0)) return setError("Enter a price above 0");
    if (discount !== undefined && !(discount > 0 && discount < price)) return setError("Sale price must be lower than the price");
    setError(null);
    save.mutate(
      {
        id,
        data: {
          product_name: form.product_name.trim(),
          description: form.description.trim(),
          category: form.category,
          price,
          discount_price: discount ?? null,
          preparation_time: form.preparation_time ? Number(form.preparation_time) : null,
          is_available: form.is_available ? 1 : 0,
          is_popular: form.is_popular ? 1 : 0,
          image: form.image || null,
        },
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
              <ProductArt category={form.category} image={form.image || undefined} className="h-24 w-24 rounded-3xl shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]" emojiClassName="text-[52px]" />
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-[#f7f9f9] dark:ring-black">
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
              media={<span className={cn("flex h-9 w-9 items-center justify-center rounded-xl text-[20px]", categoryLook(form.category)[2])}>{categoryLook(form.category)[1]}</span>}
              header="Category"
              title={form.category || "Choose a category"}
              after={<ChevronDown className="h-5 w-5 text-black/35 dark:text-white/35" />}
            />
          </List>

          <BlockTitle>Price</BlockTitle>
          <List strongIos insetIos>
            <ListInput label="Price ($)" type="text" inputMode="decimal" placeholder="0.00" value={form.price} onInput={(e: React.ChangeEvent<HTMLInputElement>) => set("price", e.target.value)} />
            <ListInput label="Sale price ($)" type="text" inputMode="decimal" placeholder="Optional" value={form.discount_price} onInput={(e: React.ChangeEvent<HTMLInputElement>) => set("discount_price", e.target.value)} />
            <ListInput label="Prep time (minutes)" type="text" inputMode="numeric" placeholder="15" value={form.preparation_time} onInput={(e: React.ChangeEvent<HTMLInputElement>) => set("preparation_time", e.target.value)} />
          </List>
          {error && <p className="px-8 text-[13px] text-[#ff3b30]">{error}</p>}

          <List strong inset dividers>
            <ListItem title="In stock" after={<Toggle checked={form.is_available} onChange={() => set("is_available", !form.is_available)} />} />
            <ListItem title="Popular tag" after={<Toggle checked={form.is_popular} onChange={() => set("is_popular", !form.is_popular)} />} />
          </List>
          <BlockFooter>{isNew ? "New products are reviewed by Diyaar before customers can see them." : "Turn off “In stock” when you run out — customers will see it as sold out."}</BlockFooter>

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
            <div className="grid grid-cols-3 gap-2.5 px-4">
              {categories?.map((c) => {
                const [, emoji, tint] = categoryLook(c.category_name);
                const selected = c.category_name === form.category;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      haptic.tap();
                      set("category", c.category_name);
                      setPickingCategory(false);
                    }}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 pb-3 transition-transform active:scale-95",
                      selected ? "border-primary bg-primary/5" : "border-transparent",
                    )}
                  >
                    <span className={cn("flex aspect-square w-full items-center justify-center rounded-xl text-[36px]", tint, !c.is_active && "opacity-50")}>{emoji}</span>
                    <span className="line-clamp-2 text-center text-[12px] font-bold leading-tight">{c.category_name}</span>
                    {!c.is_active && <span className="-mt-1 text-[10px] font-semibold text-black/40 dark:text-white/40">Hidden</span>}
                    {selected && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow">
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
              <ActionsButton
                className="!text-[#ff3b30]"
                onClick={() => {
                  setConfirmDelete(false);
                  if (id) remove.mutate(id, { onSuccess: () => navigate(-1) });
                }}
              >
                Delete
              </ActionsButton>
            </ActionsGroup>
            <ActionsGroup>
              <ActionsButton bold onClick={() => setConfirmDelete(false)}>
                Cancel
              </ActionsButton>
            </ActionsGroup>
          </Actions>
        </>
      )}
    </Screen>
  );
}
