import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderTree, Plus } from "lucide-react";
import { Actions, ActionsButton, ActionsGroup, ActionsLabel, BlockFooter, Link as KLink, List, ListInput, ListItem, Toggle } from "konsta/react";
import { useCategories, useDeleteCategory, useSaveCategory } from "@/hooks/queries";
import type { Category } from "@/api";
import { Empty, ErrorBlock, FormSheet, IconTile, Loading, Screen } from "../ui";

export default function CategoriesScreen() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useCategories();
  const save = useSaveCategory();
  const remove = useDeleteCategory();
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Category | null>(null);

  const open = (c: Category | "new") => {
    setEditing(c);
    setName(c === "new" ? "" : c.category_name);
    setDescription(c === "new" ? "" : c.description ?? "");
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
                media={<IconTile icon={FolderTree} className={c.is_active ? "bg-[#5856d6]" : "bg-[#8e8e93]"} />}
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
          <BlockFooter>Tap a category to rename, reorder or delete it. Hidden categories aren't shown to customers.</BlockFooter>
        </>
      )}

      <FormSheet
        opened={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New category" : "Edit category"}
        onSave={() => save.mutate({ id: editing === "new" ? undefined : editing?.name, data: { category_name: name.trim(), description: description.trim() } }, { onSuccess: () => setEditing(null) })}
        saving={save.isPending}
        canSave={!!name.trim()}
      >
        <List strongIos insetIos>
          <ListInput label="Name" placeholder="e.g. Breakfast" value={name} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
          <ListInput label="Description" placeholder="Optional" value={description} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} />
        </List>
      </FormSheet>

      <Actions opened={!!selected} onBackdropClick={() => setSelected(null)}>
        <ActionsGroup>
          <ActionsLabel>{selected?.category_name}</ActionsLabel>
          <ActionsButton onClick={() => (navigate("/products"), setSelected(null))}>View products</ActionsButton>
          <ActionsButton onClick={() => (selected && open(selected), setSelected(null))}>Rename</ActionsButton>
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
