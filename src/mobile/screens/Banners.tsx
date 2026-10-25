import { useNavigate } from "react-router-dom";
import { GalleryHorizontal } from "lucide-react";
import { BlockFooter } from "konsta/react";
import { useBanners, useStore } from "@/hooks/queries";
import { haptic } from "@/lib/native";
import { BannerCard } from "../BannerCarousel";
import { Empty, ErrorBlock, Loading, Screen } from "../ui";

/** Diyaar's banners on the customer app's Home, read-only. Diyaar creates them; stores can't. */
export default function BannersScreen() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useBanners();
  const { data: store } = useStore();
  const isMine = (storeName?: string) => !!store && storeName === store.store_name;
  const mine = data?.filter((b) => isMine(b.store?.name)).length ?? 0;

  return (
    <Screen title="Diyaar banners" subtitle={data ? (mine ? `${mine} for your store` : `${data.length} showing to customers`) : undefined} back tabbar onRefresh={refetch}>
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty icon={GalleryHorizontal} title="No banners right now" text="Diyaar's banners show here when they're running." />
      ) : (
        <>
          <div className="space-y-4 px-4 pt-4">
            {data.map((b) => {
              const own = isMine(b.store?.name);
              return (
                <div key={b.name}>
                  <BannerCard
                    banner={b}
                    badge={own ? "Your store" : undefined}
                    onClick={
                      own
                        ? () => {
                            haptic.tap();
                            navigate("/products");
                          }
                        : undefined
                    }
                  />
                  {b.store && <p className="mt-1.5 truncate px-1 text-[12.5px] text-black/45 dark:text-white/50">Promotes {own ? "your store" : b.store.name}</p>}
                </div>
              );
            })}
          </div>
          <BlockFooter>These are the banners customers see on Diyaar's Home. Diyaar makes them — contact Diyaar to feature your store.</BlockFooter>
        </>
      )}
    </Screen>
  );
}
