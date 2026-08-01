import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { currency, TomatoRating } from "@/components/brand";
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

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <Link to="/listing/$id" params={{ id: listing.id }} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={listing.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-xs text-muted-foreground">No photo</div>
          )}
          <span
            className={cn(
              "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              listing.type === "rent" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground",
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
              <TomatoRating value={listing.profiles.tomato_rating} showValue={false} className="text-[9px]" />
            </div>
          )}
        </div>
      </Link>
      {onToggleWish && (
        <button
          type="button"
          onClick={() => onToggleWish(listing.id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-background/90 shadow-[var(--shadow-soft)] transition-transform hover:scale-110 active:scale-95"
        >
          <Heart className={cn("h-4 w-4", wished ? "fill-destructive text-destructive" : "text-muted-foreground")} />
        </button>
      )}
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
