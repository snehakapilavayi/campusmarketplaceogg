import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { EmptyState } from "@/components/brand";
import { ListingGridSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — SwapSpace" },
      { name: "description", content: "Everything you've saved from your campus marketplace." },
      { property: "og:title", content: "Wishlist — SwapSpace" },
      { property: "og:description", content: "Everything you've saved on SwapSpace." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { userId } = useAuth();
  const wishlist = useWishlist();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["wishlist", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("wishlist")
        .select(
          "listing_id,listings(id,title,price,type,rent_period,badge,condition,listing_images(url,sort_order),profiles(full_name,swapcoin_rating))",
        )
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      return (data ?? []).map((r) => r.listings).filter(Boolean) as unknown as ListingCardData[];
    },
  });

  return (
    <AppShell title="Wishlist">
      <div className="pt-4">
        {isLoading ? (
          <ListingGridSkeleton count={4} />
        ) : items.length === 0 ? (
          <EmptyState
            variant="idea"
            title="Nothing saved yet"
            description="Tap the heart on any listing to keep an eye on it."
            action={
              <Button asChild className="mt-2 rounded-full">
                <Link to="/market">Browse the market</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((l) => (
              <ListingCard key={l.id} listing={l} wished onToggleWish={wishlist.toggle} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
