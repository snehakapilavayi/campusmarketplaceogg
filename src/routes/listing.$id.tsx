import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Flag, Heart, MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { conditionLabels, currency, EmptyState, TomatoRating, VerifiedBadge } from "@/components/brand";
import { BottomNav } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { openConversation, useCart, useWishlist } from "@/lib/marketplace";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/listing/$id")({
  head: () => ({
    meta: [
      { title: "Listing — SwapSpace" },
      { name: "description", content: "See item details, condition and seller rating before you meet on campus." },
      { property: "og:title", content: "Listing — SwapSpace" },
      { property: "og:description", content: "See item details and seller rating on SwapSpace." },
    ],
  }),
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const wishlist = useWishlist();
  const cart = useCart();
  const [active, setActive] = useState(0);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select(
          "*,listing_images(url,sort_order),categories(name,icon),profiles(id,full_name,avatar_url,bio,tomato_rating,transactions_count,verification)",
        )
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["seller-reviews", listing?.seller_id],
    enabled: !!listing?.seller_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("ratings")
        .select("id,tomatoes,review,created_at,profiles!ratings_reviewer_id_fkey(full_name)")
        .eq("reviewed_id", listing!.seller_id)
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  if (isLoading) {
    return <div className="min-h-screen animate-pulse bg-muted" />;
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <EmptyState title="Listing not found" description="It may have been sold or removed." />
      </div>
    );
  }

  const images = [...(listing.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const seller = listing.profiles;
  const isOwner = userId === listing.seller_id;

  async function handleChat() {
    if (!userId) {
      navigate({ to: "/auth", search: { mode: "login", next: `/listing/${id}` } });
      return;
    }
    try {
      const conversationId = await openConversation(id, listing!.seller_id, userId);
      navigate({ to: "/chat/$id", params: { id: conversationId } });
    } catch {
      toast.error("Couldn't open the chat. Try again.");
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="relative">
        <div className="aspect-square w-full bg-muted sm:aspect-[16/10]">
          {images[active] ? (
            <img src={images[active].url} alt={listing.title} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">No photo</div>
          )}
        </div>
        <Link
          to="/market"
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background/90 shadow-[var(--shadow-soft)]"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((img, i) => (
              <button
                key={img.url}
                onClick={() => setActive(i)}
                aria-label={`Photo ${i + 1}`}
                className={cn("h-1.5 rounded-full transition-all", i === active ? "w-6 bg-primary" : "w-1.5 bg-background/80")}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-3xl space-y-5 px-4 pt-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold leading-tight">{listing.title}</h1>
            <button
              onClick={() => wishlist.toggle(listing.id)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border"
              aria-label="Save to wishlist"
            >
              <Heart
                className={cn(
                  "h-5 w-5",
                  wishlist.ids.includes(listing.id) ? "fill-destructive text-destructive" : "text-muted-foreground",
                )}
              />
            </button>
          </div>
          <p className="mt-1 font-display text-3xl font-extrabold text-primary">
            {currency(listing.price)}
            {listing.type === "rent" && (
              <span className="text-base font-semibold text-muted-foreground">/{listing.rent_period ?? "day"}</span>
            )}
          </p>
          {listing.type === "rent" && listing.deposit ? (
            <p className="text-sm text-muted-foreground">Refundable deposit {currency(listing.deposit)}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Tag>{listing.type === "rent" ? "For rent" : "For sale"}</Tag>
          <Tag>{conditionLabels[listing.condition] ?? listing.condition}</Tag>
          {listing.categories && <Tag>{`${listing.categories.icon ?? ""} ${listing.categories.name}`}</Tag>}
        </div>

        {listing.description && (
          <div>
            <h2 className="font-display text-base font-bold">Description</h2>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {listing.description}
            </p>
          </div>
        )}

        {seller && (
          <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-accent font-display text-lg font-bold">
                {seller.avatar_url ? (
                  <img src={seller.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  seller.full_name.charAt(0)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{seller.full_name}</p>
                <div className="flex items-center gap-2">
                  <TomatoRating value={seller.tomato_rating} />
                  <span className="text-xs text-muted-foreground">· {seller.transactions_count} swaps</span>
                </div>
              </div>
              {seller.verification === "verified" && <VerifiedBadge compact />}
            </div>
            {reviews.length > 0 && (
              <ul className="mt-4 space-y-3 border-t border-border pt-4">
                {reviews.map((r) => (
                  <li key={r.id} className="text-sm">
                    <div className="flex items-center gap-2">
                      <TomatoRating value={r.tomatoes} showValue={false} className="text-[10px]" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {r.profiles?.full_name ?? "Student"}
                      </span>
                    </div>
                    {r.review && <p className="mt-0.5 text-muted-foreground">{r.review}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
          <span className="text-lg">🛡️</span>
          <p>Meet in a public campus spot, inspect the item, then pay directly. SwapSpace never handles payments.</p>
        </div>

        <button
          onClick={() => toast.success("Report submitted to the admin team")}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive"
        >
          <Flag className="h-3.5 w-3.5" /> Report this listing
        </button>
      </div>

      {!isOwner && (
        <div className="fixed inset-x-0 bottom-[68px] z-30 border-t border-border bg-background/95 p-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl gap-2">
            <Button variant="outline" size="lg" className="flex-1 rounded-full" onClick={() => cart.toggle(listing.id)}>
              <ShoppingBag className="mr-1.5 h-4 w-4" />
              {cart.ids.includes(listing.id) ? "In cart" : "Add to cart"}
            </Button>
            <Button size="lg" className="flex-1 rounded-full" onClick={handleChat}>
              <MessageCircle className="mr-1.5 h-4 w-4" /> Chat with seller
            </Button>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{children}</span>
  );
}
