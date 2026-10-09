import { useQuery } from "@tanstack/react-query";
import { Award, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CoinRating, SwapCoin } from "@/components/brand";
import { cn } from "@/lib/utils";

/** Business rules for SwapCoins — keep in one place. */
export const SWAPCOIN_RULES = {
  minRatingsForScore: 3,
  trustedMinScore: 4.5,
  trustedMinRatings: 10,
  topSellerMinSales: 25,
} as const;

export function hasScore(ratingsCount: number | null | undefined) {
  return (ratingsCount ?? 0) >= SWAPCOIN_RULES.minRatingsForScore;
}

export function swapcoinBadges(p: { rating?: number | null; ratingsCount?: number | null; salesCount?: number | null }) {
  const badges: ("trusted" | "top_seller")[] = [];
  if (Number(p.rating ?? 0) >= SWAPCOIN_RULES.trustedMinScore && (p.ratingsCount ?? 0) >= SWAPCOIN_RULES.trustedMinRatings)
    badges.push("trusted");
  if ((p.salesCount ?? 0) >= SWAPCOIN_RULES.topSellerMinSales) badges.push("top_seller");
  return badges;
}

/** Score, or "New on SwapSpace" until 3 ratings. */
export function SwapcoinScore({
  rating,
  ratingsCount,
  compact,
  className,
}: {
  rating: number | null | undefined;
  ratingsCount: number | null | undefined;
  compact?: boolean;
  className?: string;
}) {
  if (!hasScore(ratingsCount)) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-foreground",
          compact ? "text-[9px]" : "text-xs",
          className,
        )}
      >
        <SwapCoin size={compact ? 10 : 14} /> New on SwapSpace
      </span>
    );
  }
  return <CoinRating value={Number(rating) || 0} showValue={!compact} className={cn(compact && "text-[9px]", className)} />;
}

export function SwapcoinBadges({
  rating,
  ratingsCount,
  salesCount,
  className,
}: {
  rating?: number | null;
  ratingsCount?: number | null;
  salesCount?: number | null;
  className?: string;
}) {
  const badges = swapcoinBadges({ rating, ratingsCount, salesCount });
  if (!badges.length) return null;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {badges.includes("trusted") && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
          <ShieldCheck className="h-3 w-3" /> Trusted Swapper
        </span>
      )}
      {badges.includes("top_seller") && (
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
          <Award className="h-3 w-3" /> Top Seller
        </span>
      )}
    </span>
  );
}

type Summary = {
  avg_swapcoins: number;
  review_count: number;
  communication: number;
  accuracy: number;
  experience: number;
  completed_swaps: number;
  completed_sales: number;
  recent: { review: string; swapcoins: number; created_at: string; reviewer_name: string }[];
};

export function useSwapcoinSummary(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["swapcoin-summary", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_swapcoin_summary", { _id: userId! });
      if (error) throw error;
      return (data?.[0] ?? null) as unknown as Summary | null;
    },
  });
}

/** Full SwapCoins card: score, swaps, breakdown, badges, recent reviews. */
export function SwapcoinSummaryCard({ userId }: { userId: string | null | undefined }) {
  const { data } = useSwapcoinSummary(userId);
  const count = data?.review_count ?? 0;
  const avg = Number(data?.avg_swapcoins ?? 0);
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold">SwapCoins</h2>
          <p className="text-xs text-muted-foreground">
            {count} rating{count === 1 ? "" : "s"} · {data?.completed_swaps ?? 0} completed swap
            {(data?.completed_swaps ?? 0) === 1 ? "" : "s"}
          </p>
        </div>
        <SwapcoinScore rating={avg} ratingsCount={count} />
      </div>
      <SwapcoinBadges rating={avg} ratingsCount={count} salesCount={data?.completed_sales} className="mt-3" />

      {hasScore(count) && (
        <div className="mt-4 space-y-2">
          {(
            [
              ["Communication", data?.communication],
              ["Item accuracy", data?.accuracy],
              ["Experience", data?.experience],
            ] as const
          ).map(([label, v]) => (
            <div key={label} className="flex items-center gap-3 text-xs">
              <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(Number(v ?? 0) / 5) * 100}%` }} />
              </div>
              <span className="w-8 text-right font-semibold">{Number(v ?? 0).toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}

      {(data?.recent?.length ?? 0) > 0 && (
        <div className="mt-5 space-y-2 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent reviews</p>
          {data!.recent.map((r, i) => (
            <div key={i} className="rounded-2xl bg-muted/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">{r.reviewer_name}</span>
                <CoinRating value={Number(r.swapcoins)} showValue={false} className="text-[9px]" />
              </div>
              <p className="mt-1 text-sm text-foreground">{r.review}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
