import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, Trash2 } from "lucide-react";
import { Actions, ActionsButton, ActionsGroup, ActionsLabel, BlockFooter, BlockTitle, Link as KLink, List, ListInput, ListItem, Toggle } from "konsta/react";
import { useCategories, useDeleteProduct, useProducts, useSaveProduct } from "@/hooks/queries";
import { Loading, Screen, Thumb } from "../ui";

interface Form {
  product_name: string;
  description: string;
  category: string;
  price: string;
  discount_price: string;
  preparation_time: string;
  is_available: boolean;
  is_popular: boolean;
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

  useEffect(() => {
    if (form) return;
    if (isNew && categories) {
      setForm({ product_name: "", description: "", category: categories[0]?.category_name ?? "", price: "", discount_price: "", preparation_time: "", is_available: true, is_popular: false });
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
            <div className="relative">
              <Thumb id={id ?? "new"} label={form.product_name || "?"} image={product?.image} className="h-24 w-24 rounded-3xl text-[28px]" />
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-[#efeff4] dark:ring-black">
                <Camera className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-[13px] text-black/45 dark:text-white/45">Photos can be added once the live API is connected</p>
          </div>

          <List strongIos insetIos>
            <ListInput label="Name" type="text" placeholder="e.g. Chicken Shawarma" value={form.product_name} onInput={(e: React.ChangeEvent<HTMLInputElement>) => set("product_name", e.target.value)} />
            <ListInput label="Description" type="textarea" placeholder="What's in it?" inputClassName="!h-20 resize-none" value={form.description} onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => set("description", e.target.value)} />
            <ListInput label="Category" type="select" dropdown value={form.category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set("category", e.target.value)}>
              {categories?.map((c) => (
                <option key={c.name} value={c.category_name}>
                  {c.category_name}
                </option>
              ))}
            </ListInput>
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
