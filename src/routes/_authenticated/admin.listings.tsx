import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePendingListings } from "@/lib/admin";
import { currency, EmptyState } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/listings")({
  component: AdminListings,
});

function AdminListings() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: pending = [], isLoading } = usePendingListings(isAdmin);

  async function moderate(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("listings").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
    toast.success(status === "approved" ? "Listing approved" : "Listing rejected");
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-extrabold">Listings queue</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : pending.length === 0 ? (
        <EmptyState variant="happy" title="Queue is clear" description="No listings waiting for review." />
      ) : (
        pending.map((l) => {
          const image = [...(l.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
          return (
            <div key={l.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                {image && <img src={image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-semibold">{l.title}</p>
                <p className="font-display font-bold text-primary">{currency(l.price)}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" className="h-8 rounded-full" onClick={() => moderate(l.id, "approved")}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-full"
                    onClick={() => moderate(l.id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
