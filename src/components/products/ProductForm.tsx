import { useEffect, useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/shared/ResponsiveDialog";
import { useCategories, useSaveProduct } from "@/hooks/queries";
import type { Product } from "@/api";

interface FormState {
  product_name: string;
  description: string;
  category: string;
  price: string;
  discount_price: string;
  preparation_time: string;
  is_available: boolean;
  is_popular: boolean;
}

const empty = (category = ""): FormState => ({
  product_name: "",
  description: "",
  category,
  price: "",
  discount_price: "",
  preparation_time: "",
  is_available: true,
  is_popular: false,
});

export function ProductForm({ open, onOpenChange, product }: { open: boolean; onOpenChange: (o: boolean) => void; product?: Product | null }) {
  const { data: categories } = useCategories();
  const save = useSaveProduct();
  const [form, setForm] = useState<FormState>(empty());
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      product
        ? {
            product_name: product.product_name,
            description: product.description,
            category: product.category,
            price: String(product.price),
            discount_price: product.discount_price ? String(product.discount_price) : "",
            preparation_time: product.preparation_time ? String(product.preparation_time) : "",
            is_available: !!product.is_available,
            is_popular: !!product.is_popular,
          }
        : empty(categories?.[0]?.category_name),
    );
  }, [open, product, categories]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  function submit() {
    const e: typeof errors = {};
    const price = Number(form.price);
    const discount = form.discount_price ? Number(form.discount_price) : undefined;
    if (!form.product_name.trim()) e.product_name = "Enter a product name";
    if (!form.category) e.category = "Choose a category";
    if (!(price > 0)) e.price = "Enter a price above 0";
    if (discount !== undefined && !(discount > 0 && discount < price)) e.discount_price = "Sale price must be lower than the price";
    setErrors(e);
    if (Object.keys(e).length) return;

    save.mutate(
      {
        id: product?.name,
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
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={product ? "Edit product" : "Add product"}
      description={product ? product.product_name : "New products are reviewed by Diyaar before customers can see them."}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {product ? "Save changes" : "Add product"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-name">Name</Label>
          <Input id="p-name" value={form.product_name} onChange={(e) => set("product_name", e.target.value)} placeholder="e.g. Chicken Shawarma Wrap" />
          {errors.product_name && <p className="text-xs text-destructive">{errors.product_name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-desc">Description</Label>
          <Textarea id="p-desc" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What's in it? Customers read this before ordering." />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((c) => (
                <SelectItem key={c.name} value={c.category_name}>
                  {c.category_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-price">Price ($)</Label>
            <Input id="p-price" inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-sale">Sale price</Label>
            <Input id="p-sale" inputMode="decimal" value={form.discount_price} onChange={(e) => set("discount_price", e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-prep">Prep (min)</Label>
            <Input id="p-prep" inputMode="numeric" value={form.preparation_time} onChange={(e) => set("preparation_time", e.target.value)} placeholder="15" />
          </div>
        </div>
        {(errors.price || errors.discount_price) && <p className="text-xs text-destructive">{errors.price ?? errors.discount_price}</p>}

        <div className="divide-y rounded-lg border">
          <label className="flex items-center justify-between gap-4 p-3">
            <span>
              <span className="block text-sm font-medium">In stock</span>
              <span className="block text-xs text-muted-foreground">Turn off when you run out</span>
            </span>
            <Switch checked={form.is_available} onCheckedChange={(v) => set("is_available", v)} />
          </label>
          <label className="flex items-center justify-between gap-4 p-3">
            <span>
              <span className="block text-sm font-medium">Mark as popular</span>
              <span className="block text-xs text-muted-foreground">Shows a “Popular” tag in the app</span>
            </span>
            <Switch checked={form.is_popular} onCheckedChange={(v) => set("is_popular", v)} />
          </label>
        </div>

        {!product && (
          <p className="flex gap-2 rounded-lg bg-info/10 p-3 text-xs text-info">
            <Info className="h-4 w-4 shrink-0" /> Photo upload will be available when the live API is connected.
          </p>
        )}
      </div>
    </ResponsiveDialog>
  );
}
