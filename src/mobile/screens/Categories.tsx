import { useNavigate } from "react-router-dom";
import { FolderTree } from "lucide-react";
import { BlockFooter, BlockTitle, List, ListItem, Toggle } from "konsta/react";
import { useStoreCategories } from "@/hooks/queries";
import { haptic } from "@/lib/native";
import { useHomeCategories } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { Empty, ErrorBlock, Loading, ProductArt, Screen } from "../ui";

/**
 * Categories come from Diyaar and are created on the web panel, so they're read-only here.
 * The switches choose which ones show on Home; tap a row to see its items.
 */
export default function CategoriesScreen() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useStoreCategories();
  const active = data?.filter((c) => c.is_active) ?? [];
  const hidden = data?.filter((c) => !c.is_active) ?? [];
  const { shown, toggle } = useHomeCategories(active.map((c) => c.name));

  const open = (id: string) => {
    haptic.tap();
    navigate(`/products?category=${encodeURIComponent(id)}`);
  };

  return (
    <Screen title="Categories" subtitle={data ? `${shown.size} on Home` : undefined} back tabbar onRefresh={refetch}>
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty icon={FolderTree} title="No categories yet" text="Categories are added on the Diyaar web panel." />
      ) : (
        <>
          <BlockTitle>Show on Home</BlockTitle>
          <List strong inset dividers>
            {active.map((c) => (
              <ListItem
                key={c.name}
                link
                chevron={false}
                onClick={() => open(c.name)}
                media={<ProductArt category={c.category_name} image={c.image} className="h-11 w-11 rounded-xl" emojiClassName="text-[22px]" />}
                title={c.category_name}
                after={
                  // Keep the switch from also opening the category.
                  <span onClick={(e) => e.stopPropagation()}>
                    <Toggle
                      checked={shown.has(c.name)}
                      onChange={() => {
                        haptic.tap();
                        toggle(c.name);
                      }}
                    />
                  </span>
                }
              />
            ))}
          </List>
          <BlockFooter>Switch on the categories you want on Home. Tap a category to see its items. This choice is saved on this phone.</BlockFooter>

          {!!hidden.length && (
            <>
              <BlockTitle>Hidden by Diyaar</BlockTitle>
              <List strong inset dividers>
                {hidden.map((c) => (
                  <ListItem
                    key={c.name}
                    link
                    onClick={() => open(c.name)}
                    media={<ProductArt category={c.category_name} image={c.image} className={cn("h-11 w-11 rounded-xl opacity-50")} emojiClassName="text-[22px]" />}
                    title={c.category_name}
                  />
                ))}
              </List>
            </>
          )}
          <BlockFooter>To add or rename categories, use the Diyaar web panel.</BlockFooter>
        </>
      )}
    </Screen>
  );
}
