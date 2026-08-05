import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Heart } from "lucide-react";
import { currency, CoinRating } from "@/components/brand";
import { SmartImage } from "@/components/smart-image";
import { haptic, springy } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type ListingCardData = {
  id: string;
  title: string;
  price: number;
  type: "sell" | "rent";
  rent_period: string | null;
  badge: string | null;
  condition: string;
  listing_images?: { url: string; sort_order: number }[];
  profiles?: { full_name: string; tomato_rating: number } | null;
};

export function ListingCard({
  listing,
  wished,
  onToggleWish,
}: {
  listing: ListingCardData;
  wished?: boolean;
  onToggleWish?: (id: string) => void;
}) {
  const image = [...(listing.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const heartOpacity = useTransform(x, [0, 70], [0, 1]);
  const swiped = useRef(false);

  const canSwipe = !!onToggleWish && !wished && !reduce;

  return (
    <div className="relative">
      {canSwipe && (
        <motion.div
          style={{ opacity: heartOpacity }}
          className="pointer-events-none absolute inset-y-0 left-0 z-0 flex w-20 items-center justify-center rounded-2xl bg-accent"
          aria-hidden
        >
          <Heart className="h-6 w-6 fill-destructive text-destructive" />
        </motion.div>
      )}
      <motion.div
        style={canSwipe ? { x } : undefined}
        drag={canSwipe ? "x" : false}
        dragConstraints={{ left: 0, right: 90 }}
        dragElastic={0.18}
        onDragStart={() => (swiped.current = false)}
        onDrag={(_e, info) => {
          if (!swiped.current && info.offset.x > 72) {
            swiped.current = true;
            haptic([10, 30, 10]);
            onToggleWish?.(listing.id);
          }
        }}
        onDragEnd={() => x.set(0)}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        transition={springy}
        className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)]"
      >
        <Link to="/listing/$id" params={{ id: listing.id }} preload="viewport" className="block">
          <div className="relative">
            <SmartImage
              src={image}
              alt={listing.title}
              layoutId={`listing-${listing.id}`}
              imgClassName="transition-transform duration-500 group-hover:scale-105"
            />
            <span
              className={cn(
                "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                listing.type === "rent"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {listing.type === "rent" ? "For rent" : "For sale"}
            </span>
            {listing.badge && (
              <span className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold">
                {listing.badge}
              </span>
            )}
          </div>
          <div className="space-y-1 p-3">
            <p className="line-clamp-1 text-sm font-semibold">{listing.title}</p>
            <p className="font-display text-base font-bold text-foreground">
              {currency(listing.price)}
              {listing.type === "rent" && (
                <span className="text-xs font-medium text-muted-foreground">/{listing.rent_period ?? "day"}</span>
              )}
            </p>
            {listing.profiles && (
              <div className="flex items-center justify-between pt-0.5">
                <span className="line-clamp-1 text-[11px] text-muted-foreground">{listing.profiles.full_name}</span>
                <CoinRating value={listing.profiles.tomato_rating} showValue={false} className="text-[9px]" />
              </div>
            )}
          </div>
        </Link>
        {onToggleWish && (
          <motion.button
            type="button"
            whileTap={reduce ? undefined : { scale: 0.85 }}
            onClick={() => onToggleWish(listing.id)}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow-[var(--shadow-soft)] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Heart className={cn("h-4 w-4", wished ? "fill-destructive text-destructive" : "text-muted-foreground")} />
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
