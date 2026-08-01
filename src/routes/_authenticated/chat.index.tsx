import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({
    meta: [
      { title: "Messages — SwapSpace" },
      { name: "description", content: "Chat with buyers and sellers to arrange a campus handover." },
      { property: "og:title", content: "Messages — SwapSpace" },
      { property: "og:description", content: "Chat with buyers and sellers on campus." },
    ],
  }),
  component: ChatList,
});

function ChatList() {
  const { userId } = useAuth();

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id,buyer_id,seller_id,created_at,listings(title,listing_images(url,sort_order))")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      const rows = data ?? [];
      const otherIds = rows.map((c) => (c.buyer_id === userId ? c.seller_id : c.buyer_id));
      const { data: people } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", otherIds);
      const map = new Map((people ?? []).map((p) => [p.id, p]));
      return rows.map((c) => ({ ...c, other: map.get(c.buyer_id === userId ? c.seller_id : c.buyer_id) }));
    },
  });

  return (
    <AppShell title="Messages">
      <div className="space-y-2 pt-4">
        {conversations.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            description="Message a seller from any listing and it'll appear here."
            action={
              <Button asChild className="mt-2 rounded-full">
                <Link to="/market">Browse listings</Link>
              </Button>
            }
          />
        ) : (
          conversations.map((c) => {
            const image = [...(c.listings?.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
            return (
              <Link
                key={c.id}
                to="/chat/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)] transition-colors hover:bg-muted/50"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                  {image ? (
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display font-bold">{c.other?.full_name?.charAt(0) ?? "?"}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.other?.full_name ?? "Student"}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.listings?.title ?? "Listing removed"}</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
