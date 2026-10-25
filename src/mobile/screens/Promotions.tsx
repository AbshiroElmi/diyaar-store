import { Megaphone, Ticket } from "lucide-react";
import { BlockFooter } from "konsta/react";
import { toast } from "sonner";
import { usePromotions } from "@/hooks/queries";
import type { Promotion } from "@/api";
import { formatDate, formatMoney } from "@/lib/format";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";
import { CARD, Empty, ErrorBlock, Loading, Screen } from "../ui";

/** The headline of an offer, e.g. "20% off" or "Free delivery". */
function headline(p: Promotion) {
  switch (p.type) {
    case "percentage":
      return `${p.value}% off`;
    case "fixed":
      return `${formatMoney(p.value)} off`;
    case "free_delivery":
      return "Free delivery";
    case "bogo":
      return "Buy 1 get 1";
    case "cashback":
      return `${p.value}% cashback`;
  }
}

function PromotionCard({ p }: { p: Promotion }) {
  const terms = [p.min_order && `Min. order ${formatMoney(p.min_order)}`, p.max_discount && `Up to ${formatMoney(p.max_discount)}`, p.valid_until && `Until ${formatDate(p.valid_until)}`].filter(Boolean);
  return (
    <div className={cn(CARD, "overflow-hidden")}>
      {p.image && <img src={p.image} alt="" loading="lazy" decoding="async" className="h-32 w-full object-cover" />}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ff2d55]/10 text-[#ff2d55]">
            <Megaphone className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-extrabold uppercase tracking-wide text-[#ff2d55]">{headline(p)}</p>
            <p className="text-[16px] font-bold leading-snug">{p.title}</p>
            {p.description && <p className="mt-0.5 text-[14px] leading-snug text-black/55 dark:text-white/55">{p.description}</p>}
          </div>
        </div>
        {(!!terms.length || p.code) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {p.code && (
              <button
                type="button"
                onClick={() => {
                  haptic.tap();
                  navigator.clipboard?.writeText(p.code!).then(() => toast.success(`Copied ${p.code}`), () => undefined);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#ff2d55]/40 bg-[#ff2d55]/[0.06] px-2.5 py-1 font-mono text-[13px] font-bold text-[#ff2d55]"
              >
                <Ticket className="h-3.5 w-3.5" /> {p.code}
              </button>
            )}
            {terms.map((t) => (
              <span key={t as string} className="rounded-lg bg-black/[0.04] px-2.5 py-1 text-[12.5px] font-medium text-black/60 dark:bg-white/10 dark:text-white/65">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Diyaar's live offers, read-only. Diyaar runs them; stores can't create them. */
export default function PromotionsScreen() {
  const { data, isLoading, error, refetch } = usePromotions();

  return (
    <Screen title="Promotions" subtitle={data ? `${data.length} running on Diyaar` : undefined} back tabbar onRefresh={refetch}>
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty icon={Megaphone} title="No promotions right now" text="Diyaar's offers show here while they're running." />
      ) : (
        <>
          <div className="space-y-3 px-4 pt-4">
            {data.map((p) => (
              <PromotionCard key={p.name} p={p} />
            ))}
          </div>
          <BlockFooter>Diyaar runs these offers and customers get them at checkout. Contact Diyaar to run an offer for your store.</BlockFooter>
        </>
      )}
    </Screen>
  );
}
