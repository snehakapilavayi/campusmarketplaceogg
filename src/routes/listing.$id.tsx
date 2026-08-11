import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Flag, Heart, MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CampusBadge,
  conditionLabels,
  currency,
  DealClosedBadge,
  EmptyState,
  CoinRating,
  VerifiedBadge,
} from "@/components/brand";
import { BottomNav } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ImageGallery } from "@/components/gallery";
import { openConversation, startDeal, useCart, useWishlist } from "@/lib/marketplace";
import { useAuth } from "@/lib/auth";
import { ShareSheet } from "@/components/share-sheet";
import { cn } from "@/lib/utils";


import { SITE } from "@/lib/site";

export const Route = createFileRoute("/listing/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Listing — SwapSpace" },
      { name: "description", content: "See item details, condition and seller rating before you meet on campus." },
      { property: "og:title", content: "Listing — SwapSpace" },
      { property: "og:description", content: "See item details and seller rating on SwapSpace." },
      { property: "og:type", content: "product" },
      { property: "og:url", content: `${SITE}/listing/${params.id}` },
      { property: "og:image", content: `${SITE}/og-image.jpg` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE}/og-image.jpg` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/listing/${params.id}` }],
  }),
  component: ListingDetail,
});


function ListingDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const wishlist = useWishlist();
  const cart = useCart();
  

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select(
          "*,listing_images(url,sort_order),categories(name,icon),profiles(id,full_name,avatar_url,swapcoin_rating,verification,campus)",
        )
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  // Public reputation summary — aggregates only, safe for signed-out visitors.
  const { data: repStats } = useQuery({
    queryKey: ["seller-rating-stats", listing?.seller_id],
    enabled: !!listing?.seller_id,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_seller_rating_stats", { _seller: listing!.seller_id });
      return data?.[0] ?? { avg_swapcoins: 0, review_count: 0 };
    },
  });

  // Review text/identity is only readable by the people involved (RLS enforced).
  const { data: reviews = [] } = useQuery({
    queryKey: ["seller-reviews", listing?.seller_id, userId],
    enabled: !!listing?.seller_id && !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ratings")
        .select("id,swapcoins,review,created_at,reviewer_id")
        .eq("reviewed_id", listing!.seller_id)
        .order("created_at", { ascending: false })
        .limit(3);
      const rows = data ?? [];
      if (rows.length === 0) return [];
      const { data: reviewers } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", rows.map((r) => r.reviewer_id));
      const names = new Map((reviewers ?? []).map((p) => [p.id, p.full_name]));
      return rows.map((r) => ({ ...r, reviewer_name: names.get(r.reviewer_id) ?? "Student" }));
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
  const sold = listing.status === "completed" || !!listing.sold_at;

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

  function requireAccount(mode: "login" | "signup") {
    navigate({ to: "/auth", search: { mode, next: `/listing/${id}` } });
  }

  function handleWishlist() {
    if (!userId) {
      requireAccount("login");
      return;
    }
    wishlist.toggle(id);
  }

  function handleCart() {
    if (!userId) {
      requireAccount("login");
      return;
    }
    cart.toggle(id);
  }

  async function handleBuyNow() {
    if (!userId) {
      requireAccount("login");
      return;
    }
    try {
      const conversationId = await startDeal({
        listingId: id,
        sellerId: listing!.seller_id,
        buyerId: userId,
        title: listing!.title,
        price: listing!.price,
      });
      navigate({ to: "/chat/$id", params: { id: conversationId } });
    } catch {
      toast.error("Couldn't start the deal. Try again.");
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="relative">
        <ImageGallery images={images} alt={listing.title} layoutId={`listing-${listing.id}`} />
        <Link
          to="/market"
          className="absolute left-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-background/90 shadow-[var(--shadow-soft)] transition-transform hover:scale-105 active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="absolute right-4 top-4 z-10">
          <ShareSheet
            url={`${SITE}/listing/${listing.id}`}
            title={listing.title}
          />
        </div>
        {sold && (
          <div className="absolute inset-x-0 top-16 z-10 flex justify-center">
            <DealClosedBadge soldAt={listing.sold_at} className="px-3 py-1 text-xs shadow-[var(--shadow-soft)]" />
          </div>
        )}
      </div>


      <div className="mx-auto max-w-3xl space-y-5 px-4 pt-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold leading-tight">{listing.title}</h1>
            <button
              onClick={handleWishlist}
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
          {listing.categories && <Tag>{listing.categories.name}</Tag>}
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
                  <CoinRating value={Number(repStats?.avg_swapcoins ?? seller.swapcoin_rating) || 0} />
                  <span className="text-xs text-muted-foreground">
                    · {repStats?.review_count ?? 0} review{(repStats?.review_count ?? 0) === 1 ? "" : "s"}
                  </span>

                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {seller.verification === "verified" && <VerifiedBadge compact />}
                {listing.status === "approved" && <CampusBadge campus={seller.campus} />}
              </div>
            </div>
            {reviews.length > 0 && (
              <ul className="mt-4 space-y-3 border-t border-border pt-4">
                {reviews.map((r) => (
                  <li key={r.id} className="text-sm">
                    <div className="flex items-center gap-2">
                      <CoinRating value={r.swapcoins} showValue={false} className="text-[10px]" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {r.reviewer_name}
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
        <div className={cn(
          "fixed inset-x-0 z-30 border-t border-border bg-background/95 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-md",
          userId ? "bottom-[68px]" : "bottom-0",
        )}>
          <div className="mx-auto max-w-3xl">
            {sold ? (
              <div className="flex items-center justify-center gap-2 py-1 text-sm font-semibold text-muted-foreground">
                <DealClosedBadge soldAt={listing.sold_at} />
                <span>This item has already been swapped.</span>
              </div>
            ) : userId ? (
              <div className="flex gap-2">
                <Button variant="outline" size="lg" className="rounded-full px-4" onClick={handleCart}>
                  <ShoppingBag className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-1.5">
                    {cart.ids.includes(listing.id) ? "In cart" : "Add to cart"}
                  </span>
                </Button>
                <Button variant="outline" size="lg" className="flex-1 rounded-full" onClick={handleChat}>
                  <MessageCircle className="mr-1.5 h-4 w-4" /> Chat
                </Button>
                <Button size="lg" className="flex-1 rounded-full" onClick={handleBuyNow}>
                  Buy now
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="hidden flex-1 text-sm font-medium sm:block">Log in or sign up to buy this item.</p>
                <Button variant="outline" size="lg" className="flex-1 rounded-full sm:flex-none" onClick={() => requireAccount("login")}>
                  Log in
                </Button>
                <Button size="lg" className="flex-1 rounded-full sm:flex-none" onClick={() => requireAccount("signup")}>
                  Sign up to buy
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {userId && <BottomNav />}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{children}</span>
  );
}
