import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { currency, EmptyState } from "@/components/brand";
import { ListSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { openConversation, startDeal, useCart } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({
    meta: [
      { title: "Cart — SwapSpace" },
      { name: "description", content: "Items you plan to pick up. Message sellers and arrange a campus handover." },
      { property: "og:title", content: "Cart — SwapSpace" },
      { property: "og:description", content: "Items you plan to pick up on campus." },
    ],
  }),
  component: CartPage,
});

type CartRow = {
  id: string;
  title: string;
  price: number;
  type: "sell" | "rent";
  rent_period: string | null;
  seller_id: string;
  listing_images: { url: string; sort_order: number }[];
};

function CartPage() {
  const { userId } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["cart", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("cart")
        .select("listing_id,listings(id,title,price,type,rent_period,seller_id,listing_images(url,sort_order))")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      return (data ?? []).map((r) => r.listings).filter(Boolean) as unknown as CartRow[];
    },
  });

  const total = items.reduce((sum, i) => sum + Number(i.price), 0);
  const [busy, setBusy] = useState<string | null>(null);

  async function contact(item: CartRow) {
    try {
      const id = await openConversation(item.id, item.seller_id, userId!);
      navigate({ to: "/chat/$id", params: { id } });
    } catch {
      toast.error("Couldn't open the chat");
    }
  }

  /** Buy now = start the deal in chat. SwapSpace never handles the payment. */
  async function buyNow(item: CartRow) {
    setBusy(item.id);
    try {
      const id = await startDeal({
        listingId: item.id,
        sellerId: item.seller_id,
        buyerId: userId!,
        title: item.title,
        price: item.price,
      });
      navigate({ to: "/chat/$id", params: { id } });
    } catch {
      toast.error("Couldn't start the deal. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function buyAll() {
    const first = items[0];
    if (!first) return;
    setBusy("all");
    try {
      for (const item of items) {
        await startDeal({
          listingId: item.id,
          sellerId: item.seller_id,
          buyerId: userId!,
          title: item.title,
          price: item.price,
        });
      }
      const id = await openConversation(first.id, first.seller_id, userId!);
      toast.success(
        items.length > 1 ? `Messaged ${items.length} sellers — check your chats` : "Deal started with the seller",
      );
      navigate({ to: "/chat/$id", params: { id } });
    } catch {
      toast.error("Couldn't start the deals. Try again.");
    } finally {
      setBusy(null);
    }
  }


  return (
    <AppShell title="Cart">
      <div className="space-y-4 pt-4">
        {isLoading ? (
          <ListSkeleton count={3} />
        ) : items.length === 0 ? (
          <EmptyState
            variant="sad"
            title="Your cart is empty"
            description="Add items you want to pick up, then message the sellers together."
            action={
              <Button asChild className="mt-2 rounded-full">
                <Link to="/market">Find something</Link>
              </Button>
            }
          />
        ) : (
          <>
            {items.map((item) => {
              const image = [...(item.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
              return (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-2xl border border-border bg-card p-2.5 shadow-[var(--shadow-soft)] sm:p-3"
                >
                  <Link to="/listing/$id" params={{ id: item.id }} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {image && <img src={image} alt="" className="h-full w-full object-cover" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-semibold">{item.title}</p>
                    <p className="font-display font-bold text-primary">
                      {currency(item.price)}
                      {item.type === "rent" && (
                        <span className="text-xs text-muted-foreground">/{item.rent_period ?? "day"}</span>
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        className="h-8 rounded-full"
                        disabled={busy !== null}
                        onClick={() => buyNow(item)}
                      >
                        {busy === item.id ? "Opening…" : "Buy now"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full"
                        disabled={busy !== null}
                        onClick={() => contact(item)}
                      >
                        <MessageCircle className="mr-1 h-3.5 w-3.5" /> Message
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Remove ${item.title} from cart`}
                        className="h-8 rounded-full text-muted-foreground hover:text-destructive"
                        onClick={() => cart.toggle(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                SwapSpace doesn't process payments. “Buy now” messages the seller so you can agree on a campus
                handover — pay them directly when you meet.
              </p>
            </div>

            {/* Sticky checkout bar: sits above the bottom nav on every screen size. */}
            <div className="sticky bottom-[76px] z-20 -mx-1 rounded-3xl border border-border bg-background/95 p-3 shadow-[var(--shadow-lift)] backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    Estimated total · {items.length} item{items.length === 1 ? "" : "s"}
                  </p>
                  <p className="font-display text-xl font-extrabold">{currency(total)}</p>
                </div>
                <Button
                  size="lg"
                  className="shrink-0 rounded-full"
                  disabled={busy !== null}
                  onClick={buyAll}
                >
                  {busy === "all" ? "Starting…" : "Buy now"}
                </Button>
              </div>
            </div>

          </>
        )}
      </div>
    </AppShell>
  );
}
