import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { CategoryIcon } from "@/components/category-icon";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — SwapSpace" },
      { name: "description", content: "Books, cycles, electronics, hostel gear and more — browse by category." },
      { property: "og:title", content: "Categories — SwapSpace" },
      { property: "og:description", content: "Browse campus listings by category." },
    ],
  }),
  component: Categories,
});

function Categories() {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-with-counts"],
    queryFn: async () => {
      const [{ data: cats }, { data: listings }] = await Promise.all([
        supabase.from("categories").select("*").eq("active", true).order("sort_order"),
        supabase.from("listings").select("category_id").eq("status", "approved"),
      ]);
      const counts = new Map<string, number>();
      (listings ?? []).forEach((l) => {
        if (l.category_id) counts.set(l.category_id, (counts.get(l.category_id) ?? 0) + 1);
      });
      return (cats ?? []).map((c) => ({ ...c, count: counts.get(c.id) ?? 0 }));
    },
  });

  return (
    <AppShell title="Categories">
      <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-3">
        {categories.map((c) => (
          <Link
            key={c.id}
            to="/market"
            className="group flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent">
              <CategoryIcon name={c.icon} className="h-6 w-6 text-accent-foreground" />
            </span>
            <div className="mt-6">
              <p className="font-display text-base font-bold">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.count} listings</p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
