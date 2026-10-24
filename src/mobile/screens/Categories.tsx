import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, FolderTree, Plus } from "lucide-react";
import { toast } from "sonner";
import { ActionsButton, ActionsGroup, ActionsLabel, BlockFooter, Link as KLink, List, ListInput, ListItem, Toggle } from "konsta/react";
import { useCategories, useDeleteCategory, useSaveCategory } from "@/hooks/queries";
import type { Category } from "@/api";
import { haptic } from "@/lib/native";
import { readPhoto } from "@/lib/photo";
import { cn } from "@/lib/utils";
import { Actions, Empty, ErrorBlock, FormSheet, Loading, ProductArt, Screen } from "../ui";

export default function CategoriesScreen() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useCategories();
  const save = useSaveCategory();
  const remove = useDeleteCategory();
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Category | null>(null);

  const open = (c: Category | "new") => {
    setEditing(c);
    setName(c === "new" ? "" : c.category_name);
    setDescription(c === "new" ? "" : c.description ?? "");
    setImage(c === "new" ? "" : c.image ?? "");
  };

  const move = (c: Category, dir: -1 | 1) => {
    const i = data!.findIndex((x) => x.name === c.name);
    const other = data![i + dir];
    if (!other) return;
    save.mutate({ id: c.name, data: { sort_order: other.sort_order } });
    save.mutate({ id: other.name, data: { sort_order: c.sort_order } });
  };

  return (
    <Screen
      title="Categories"
      back
      tabbar
      onRefresh={refetch}
      right={
        <KLink navbar iconOnly onClick={() => open("new")}>
          <Plus className="h-7 w-7" />
        </KLink>
      }
    >
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty icon={FolderTree} title="No categories" text="Group your menu into sections like Breakfast or Drinks." />
      ) : (
        <>
          <List strong inset dividers>
            {data.map((c) => (
              <ListItem
                key={c.name}
                link
                chevron={false}
                onClick={() => setSelected(c)}
                media={<ProductArt category={c.category_name} image={c.image} className={cn("h-11 w-11 rounded-xl", !c.is_active && "opacity-50 grayscale")} emojiClassName="text-[24px]" />}
                title={c.category_name}
                text={`${c.product_count} products${c.is_active ? "" : " · hidden"}`}
                after={
                  <span onClick={(e) => e.stopPropagation()}>
                    <Toggle checked={!!c.is_active} onChange={() => save.mutate({ id: c.name, data: { is_active: c.is_active ? 0 : 1 } })} />
                  </span>
                }
              />
            ))}
          </List>
          <BlockFooter>Tap a category to change its photo, rename, reorder or delete it. Hidden categories aren't shown to customers.</BlockFooter>
        </>
      )}

      <FormSheet
        opened={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New category" : "Edit category"}
        onSave={() => save.mutate({ id: editing === "new" ? undefined : editing?.name, data: { category_name: name.trim(), description: description.trim(), image: image || null } }, { onSuccess: () => setEditing(null) })}
        saving={save.isPending}
        canSave={!!name.trim()}
      >
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
              setImage(await readPhoto(file, 600));
              haptic.tap();
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        />
        <div className="flex flex-col items-center pt-5">
          <button type="button" onClick={() => fileRef.current?.click()} className="relative transition-transform active:scale-95">
            <ProductArt category={name} image={image || undefined} className="h-24 w-24 rounded-3xl shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]" emojiClassName="text-[52px]" />
            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-white dark:ring-[#1c1c1d]">
              <Camera className="h-4 w-4" />
            </span>
          </button>
          <div className="mt-2 flex items-center gap-3 text-[13px] font-semibold">
            <button type="button" onClick={() => fileRef.current?.click()} className="text-primary">
              {image ? "Change photo" : "Add photo"}
            </button>
            {image && (
              <button type="button" onClick={() => setImage("")} className="text-[#ff3b30]">
                Remove
              </button>
            )}
          </div>
        </div>
        <List strongIos insetIos>
          <ListInput label="Name" placeholder="e.g. Breakfast" value={name} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
          <ListInput label="Description" placeholder="Optional" value={description} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} />
        </List>
      </FormSheet>

      <Actions opened={!!selected} onBackdropClick={() => setSelected(null)}>
        <ActionsGroup>
          <ActionsLabel>{selected?.category_name}</ActionsLabel>
          <ActionsButton onClick={() => (navigate("/products"), setSelected(null))}>View products</ActionsButton>
          <ActionsButton onClick={() => (selected && open(selected), setSelected(null))}>Edit photo & name</ActionsButton>
          <ActionsButton onClick={() => (selected && move(selected, -1), setSelected(null))}>Move up</ActionsButton>
          <ActionsButton onClick={() => (selected && move(selected, 1), setSelected(null))}>Move down</ActionsButton>
          <ActionsButton className="!text-[#ff3b30]" onClick={() => (selected && remove.mutate(selected.name), setSelected(null))}>
            Delete
          </ActionsButton>
        </ActionsGroup>
        <ActionsGroup>
          <ActionsButton bold onClick={() => setSelected(null)}>
            Cancel
          </ActionsButton>
        </ActionsGroup>
      </Actions>
    </Screen>
  );
}
