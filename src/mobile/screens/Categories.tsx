import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Camera, CheckCircle2, Download, FileDown, FileUp, FolderPlus, FolderTree, Plus } from "lucide-react";
import { toast } from "sonner";
import { ActionsButton, ActionsGroup, ActionsLabel, BlockFooter, Link as KLink, List, ListInput, ListItem, Toggle } from "konsta/react";
import { useCategories, useDeleteCategory, useImportCategories, useSaveCategory } from "@/hooks/queries";
import type { Category } from "@/api";
import { categoriesToCsv, categoryTemplateCsv, readCategoriesCsv, saveCsv, type CategoryImportRow } from "@/lib/csv";
import { haptic } from "@/lib/native";
import { readPhoto } from "@/lib/photo";
import { cn } from "@/lib/utils";
import { Actions, CARD, Empty, ErrorBlock, FormSheet, Loading, ProductArt, Screen } from "../ui";

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

  // ── Add / import / export menu ──
  const [menuOpen, setMenuOpen] = useState(false);
  const [importRows, setImportRows] = useState<CategoryImportRow[] | null>(null);
  const importer = useImportCategories();
  const csvRef = useRef<HTMLInputElement>(null);
  const goodRows = importRows?.filter((r) => r.data) ?? [];
  const badRows = importRows?.filter((r) => r.error) ?? [];
  const pick = (fn: () => void) => () => {
    haptic.tap();
    setMenuOpen(false);
    fn();
  };
  const exportCsv = async () => {
    if (!data?.length) return toast.error("No categories to export yet");
    try {
      await saveCsv(`categories-${new Date().toISOString().slice(0, 10)}.csv`, categoriesToCsv(data));
    } catch (err) {
      if (!/cancel/i.test(String((err as Error)?.message))) toast.error("Couldn't export the file");
    }
  };
  const onCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const rows = readCategoriesCsv(await file.text(), data ?? []);
      if (!rows.length) return toast.error("No categories found in that file");
      setImportRows(rows);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
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
        <KLink
          navbar
          iconOnly
          onClick={() => {
            haptic.tap();
            setMenuOpen(true);
          }}
        >
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

      <input ref={csvRef} type="file" accept=".csv,text/csv,text/comma-separated-values" className="hidden" onChange={onCsv} />

      <Actions opened={menuOpen} onBackdropClick={() => setMenuOpen(false)}>
        <ActionsGroup>
          <ActionsLabel>Categories</ActionsLabel>
          <ActionsButton onClick={pick(() => open("new"))}>
            <span className="flex items-center gap-3"><FolderPlus className="h-5 w-5 text-primary" /> Add category</span>
          </ActionsButton>
          <ActionsButton onClick={pick(() => csvRef.current?.click())}>
            <span className="flex items-center gap-3"><FileUp className="h-5 w-5 text-primary" /> Import from CSV</span>
          </ActionsButton>
          <ActionsButton onClick={pick(exportCsv)}>
            <span className="flex items-center gap-3"><FileDown className="h-5 w-5 text-primary" /> Export CSV{data ? ` (${data.length})` : ""}</span>
          </ActionsButton>
          <ActionsButton onClick={pick(() => saveCsv("categories-template.csv", categoryTemplateCsv()))}>
            <span className="flex items-center gap-3"><Download className="h-5 w-5 text-black/45 dark:text-white/50" /> Download CSV template</span>
          </ActionsButton>
        </ActionsGroup>
      </Actions>

      <FormSheet
        opened={!!importRows}
        onClose={() => setImportRows(null)}
        title="Import categories"
        saveLabel={`Import ${goodRows.length}`}
        saving={importer.isPending}
        canSave={goodRows.length > 0}
        onSave={() => importer.mutate(goodRows.map((r) => r.data!), { onSuccess: () => setImportRows(null) })}
      >
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-primary/10 p-3">
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-primary"><CheckCircle2 className="h-4 w-4" /> Ready</p>
              <p className="tabular mt-1 text-[24px] font-extrabold leading-none">{goodRows.length}</p>
            </div>
            <div className={cn("rounded-xl p-3", badRows.length ? "bg-[#ff3b30]/10" : "bg-black/[0.04] dark:bg-white/10")}>
              <p className={cn("flex items-center gap-1.5 text-[12px] font-bold", badRows.length ? "text-[#ff3b30]" : "text-black/45 dark:text-white/50")}><AlertCircle className="h-4 w-4" /> Skipped</p>
              <p className="tabular mt-1 text-[24px] font-extrabold leading-none">{badRows.length}</p>
            </div>
          </div>

          {!!badRows.length && (
            <div className={cn(CARD, "divide-y divide-black/[0.06] dark:divide-white/10")}>
              {badRows.map((r) => (
                <p key={r.line} className="flex gap-2 px-3 py-2 text-[13px]">
                  <span className="shrink-0 font-bold text-black/40 dark:text-white/40">Row {r.line}</span>
                  <span className="text-[#ff3b30]">{r.error}</span>
                </p>
              ))}
            </div>
          )}

          {!!goodRows.length && (
            <div className={cn(CARD, "divide-y divide-black/[0.06] dark:divide-white/10")}>
              {goodRows.map(({ line, data: d }) => (
                <div key={line} className="flex items-center gap-3 px-3 py-2.5">
                  <ProductArt category={d!.category_name} className={cn("h-10 w-10 shrink-0 rounded-lg", !d!.is_active && "opacity-50 grayscale")} emojiClassName="text-[20px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold">{d!.category_name}</p>
                    <p className="truncate text-[12px] text-black/45 dark:text-white/50">{[d!.description, d!.is_active ? "" : "hidden"].filter(Boolean).join(" · ") || "Visible"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="px-1 text-[12px] text-black/45 dark:text-white/50">Columns: name, description, visible (yes/no). Photos can be added to each category afterwards.</p>
        </div>
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
      </Actions>
    </Screen>
  );
}
