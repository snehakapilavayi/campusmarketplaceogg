import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { ListingCard, ListingCardSkeleton, type ListingCardData } from "@/components/listing-card";
import { EmptyState, Mascot } from "@/components/brand";
import { useWishlist } from "@/lib/marketplace";
import { useAuth } from "@/lib/auth";
import { Reveal } from "@/lib/motion";
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
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://swapspace.lovable.app/market" },
      { property: "og:image", content: "https://swapspace.lovable.app/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://swapspace.lovable.app/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://swapspace.lovable.app/market" }],
  }),
  component: Market,
});

const LISTING_SELECT =
  "id,title,price,type,rent_period,badge,condition,created_at,featured,category_id,listing_images(url,sort_order),profiles(full_name,tomato_rating)";

type Filter = "all" | "sell" | "rent";

const POPULAR_SEARCHES = ["Lab Coat", "Casio FX-991EX", "Mini Fridge", "Drawing Board"] as const;

const CATEGORY_EMPTY: Record<string, string> = {
  books: "No textbooks listed yet. Be the first to list one!",
  electronics: "No gadgets on campus right now. List your spare one!",
  furniture: "No hostel furniture listed yet. Be the first!",
  stationery: "No stationery listed yet. Someone needs your spare set!",
  sports: "No sports gear listed yet. Be the first to list one!",
  lab: "No lab gear listed yet. Lab coats and kits go fast — list yours!",
};


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
    queryKey: ["event-banner"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("event_banners")
        .select("*")
        .eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${today}`)
        .or(`ends_at.is.null,ends_at.gte.${today}`)
        .order("starts_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Debounce the search term so infinite scroll doesn't refetch on every keystroke.
  const [term, setTerm] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setTerm(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const PAGE = 12;
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["listings", filter, category, term],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let q = supabase.from("listings").select(LISTING_SELECT).eq("status", "approved");
      if (filter !== "all") q = q.eq("type", filter);
      if (category) q = q.eq("category_id", category);
      if (term) q = q.ilike("title", `%${term}%`);
      const { data } = await q
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .range(pageParam * PAGE, pageParam * PAGE + PAGE - 1);
      return (data ?? []) as unknown as (ListingCardData & { featured: boolean })[];
    },
    getNextPageParam: (lastPage, pages) => (lastPage.length < PAGE ? undefined : pages.length),
  });

  const visible = useMemo(() => (data?.pages ?? []).flat(), [data]);

  // Intersection sentinel → load the next page automatically.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const featured = visible.filter((l) => l.featured).slice(0, 8);

  const hasFilters = !!term || filter !== "all" || !!category;
  const activeCategory = categories.find((c) => c.id === category);
  const emptyMessage = term
    ? `No results for "${term}". Try another keyword or clear your filters.`
    : activeCategory
      ? (CATEGORY_EMPTY[(activeCategory.slug ?? activeCategory.name).toLowerCase()] ??
        `No ${activeCategory.name.toLowerCase()} listed yet. Be the first to list one!`)
      : "No listings match your search. Try another keyword or be the first to list something.";



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

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {POPULAR_SEARCHES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuery(s)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                query === s
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
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
          <div className="relative rounded-3xl bg-secondary px-6 py-6 pr-28 text-secondary-foreground">
            <div className="max-w-[70%]">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Campus event</p>
              <h2 className="mt-1 font-display text-xl font-extrabold">{banner.title}</h2>
              {banner.description && (
                <p className="mt-1 text-sm text-secondary-foreground/80">{banner.description}</p>
              )}
            </div>
            <Mascot variant="point" size="sm" className="absolute bottom-2 right-2" alt="" />

          </div>
        )}

        <Reveal>
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
        </Reveal>

        {featured.length > 0 && !query && (
          <Reveal delay={0.05}>
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
          </Reveal>
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
              description={emptyMessage}
              action={
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  <Button asChild className="rounded-full">
                    <Link to="/sell">List an item</Link>
                  </Button>
                  {hasFilters && (
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setQuery("");
                        setFilter("all");
                        setCategory(null);
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              }
            />

          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {visible.map((l, i) => (
                  <Reveal key={l.id} delay={Math.min(i, 5) * 0.03}>
                    <ListingCard listing={l} wished={wishlist.ids.includes(l.id)} onToggleWish={wishlist.toggle} />
                  </Reveal>
                ))}
              </div>
              {isFetchingNextPage && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ListingCardSkeleton key={i} />
                  ))}
                </div>
              )}
              <div ref={sentinelRef} className="h-8" aria-hidden />
              {!hasNextPage && visible.length > PAGE && (
                <p className="py-4 text-center text-xs text-muted-foreground">That's everything on campus for now.</p>
              )}
            </>
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
