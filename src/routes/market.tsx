import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { ListingCard, ListingCardSkeleton, type ListingCardData } from "@/components/listing-card";
import { EmptyState, Mascot } from "@/components/brand";
import { useWishlist } from "@/lib/marketplace";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/category-icon";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Marketplace — SwapSpace" },
      {
        name: "description",
        content: "Browse everything students are selling and renting on campus right now.",
      },
      { property: "og:title", content: "Marketplace — SwapSpace" },
      { property: "og:description", content: "Browse what students are selling and renting on campus." },
    ],
  }),
  component: Market,
});

const LISTING_SELECT =
  "id,title,price,type,rent_period,badge,condition,created_at,featured,category_id,listing_images(url,sort_order),profiles(full_name,tomato_rating)";

type Filter = "all" | "sell" | "rent";

function Market() {
  const { profile } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState<string | null>(null);
  const wishlist = useWishlist();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

  const { data: banner } = useQuery({
    queryKey: ["banner"],
    queryFn: async () => {
      const { data } = await supabase.from("event_banners").select("*").eq("active", true).limit(1).maybeSingle();
      return data;
    },
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings", filter, category],
    queryFn: async () => {
      let q = supabase.from("listings").select(LISTING_SELECT).eq("status", "approved");
      if (filter !== "all") q = q.eq("type", filter);
      if (category) q = q.eq("category_id", category);
      const { data } = await q.order("featured", { ascending: false }).order("created_at", { ascending: false });
      return (data ?? []) as unknown as (ListingCardData & { featured: boolean })[];
    },
  });

  const visible = useMemo(() => {
    if (!listings) return [];
    const term = query.trim().toLowerCase();
    if (!term) return listings;
    return listings.filter((l) => l.title.toLowerCase().includes(term));
  }, [listings, query]);

  const featured = visible.filter((l) => l.featured).slice(0, 6);

  return (
    <AppShell>
      <div className="space-y-6 pt-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold">
            {profile ? `Hey ${profile.full_name.split(" ")[0]} 👋` : "Campus marketplace"}
          </h1>
          <p className="text-sm text-muted-foreground">What are you looking for today?</p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books, gadgets, calculators…"
              className="h-12 rounded-full pl-10"
              maxLength={80}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-full"
            onClick={() => setFilter(filter === "all" ? "sell" : filter === "sell" ? "rent" : "all")}
            aria-label="Listing type filter"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          {(["all", "sell", "rent"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                filter === f
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? "Everything" : f === "sell" ? "For sale" : "For rent"}
            </button>
          ))}
        </div>

        {banner && (
          <div className="relative overflow-hidden rounded-3xl bg-secondary px-6 py-6 text-secondary-foreground">
            <div className="max-w-[70%]">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Campus event</p>
              <h2 className="mt-1 font-display text-xl font-extrabold">{banner.title}</h2>
              {banner.description && (
                <p className="mt-1 text-sm text-secondary-foreground/80">{banner.description}</p>
              )}
            </div>
            <Mascot variant="point" className="absolute -bottom-2 right-3 h-24 w-auto" alt="" />
          </div>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Categories</h2>
            <Link to="/categories" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
              See all
            </Link>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            <CategoryChip label="All" active={!category} onClick={() => setCategory(null)} />
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                label={c.name}
                icon={c.icon}
                active={category === c.id}
                onClick={() => setCategory(category === c.id ? null : c.id)}
              />
            ))}
          </div>
        </section>

        {featured.length > 0 && !query && (
          <section>
            <h2 className="mb-3 font-display text-base font-bold">Featured on campus</h2>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
              {featured.map((l) => (
                <div key={l.id} className="w-44 shrink-0">
                  <ListingCard listing={l} wished={wishlist.ids.includes(l.id)} onToggleWish={wishlist.toggle} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 font-display text-base font-bold">
            {query ? `Results for "${query}"` : "Fresh listings"}
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              description="No listings match your search. Try another keyword or be the first to list something."
              action={
                <Button asChild className="mt-2 rounded-full">
                  <Link to="/sell">List an item</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((l) => (
                <ListingCard key={l.id} listing={l} wished={wishlist.ids.includes(l.id)} onToggleWish={wishlist.toggle} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: string | null;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
      )}
    >
      {icon !== undefined && <CategoryIcon name={icon} className="h-4 w-4" />}
      {label}
    </button>
  );
}
