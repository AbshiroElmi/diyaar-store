import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, FolderTree, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { ResponsiveDialog } from "@/components/shared/ResponsiveDialog";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/States";
import { useCategories, useDeleteCategory, useSaveCategory } from "@/hooks/queries";
import type { Category } from "@/api";

function CategoryForm({ open, onOpenChange, category }: { open: boolean; onOpenChange: (o: boolean) => void; category: Category | null }) {
  const save = useSaveCategory();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setName(category?.category_name ?? "");
      setDescription(category?.description ?? "");
    }
  }, [open, category]);

  const submit = () =>
    save.mutate({ id: category?.name, data: { category_name: name.trim(), description: description.trim() } }, { onSuccess: () => onOpenChange(false) });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={category ? "Edit category" : "New category"}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim() || save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Name</Label>
          <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Breakfast" autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-desc">Description (optional)</Label>
          <Textarea id="c-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Shown under the category name in the app" />
        </div>
      </div>
    </ResponsiveDialog>
  );
}

export default function Categories() {
  const { data, isLoading, error, refetch } = useCategories();
  const save = useSaveCategory();
  const remove = useDeleteCategory();
  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const move = (index: number, dir: -1 | 1) => {
    if (!data) return;
    const a = data[index];
    const b = data[index + dir];
    if (!a || !b) return;
    save.mutate({ id: a.name, data: { sort_order: b.sort_order } });
    save.mutate({ id: b.name, data: { sort_order: a.sort_order } });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Categories"
        description="Group your products. The order here is the order customers see."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> New category
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <ListSkeleton rows={6} />
        ) : !data?.length ? (
          <EmptyState icon={FolderTree} title="No categories yet" description="Create categories like “Breakfast” or “Drinks” to organise your menu." />
        ) : (
          <div className="divide-y">
            {data.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 p-3 sm:p-4">
                <div className="flex flex-col">
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === 0 || save.isPending} onClick={() => move(i, -1)} aria-label="Move up">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === data.length - 1 || save.isPending} onClick={() => move(i, 1)} aria-label="Move down">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.category_name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    <Link to="/products" className="hover:underline">
                      {c.product_count} product{c.product_count === 1 ? "" : "s"}
                    </Link>
                    {c.description ? ` · ${c.description}` : ""}
                  </p>
                </div>
                <label className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                  Visible
                  <Switch checked={!!c.is_active} onCheckedChange={(v) => save.mutate({ id: c.name, data: { is_active: v ? 1 : 0 } })} />
                </label>
                <Switch className="sm:hidden" checked={!!c.is_active} onCheckedChange={(v) => save.mutate({ id: c.name, data: { is_active: v ? 1 : 0 } })} aria-label="Visible" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditing(c);
                    setFormOpen(true);
                  }}
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleting(c)} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <CategoryForm open={formOpen} onOpenChange={setFormOpen} category={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.category_name}”?`}
        description={deleting?.product_count ? "This category still has products. Move them to another category first." : "This can't be undone."}
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleting && remove.mutate(deleting.name)}
      />
    </div>
  );
}
