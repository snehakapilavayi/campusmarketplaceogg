import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAdminListings, type AdminListingFilter } from "@/lib/admin";
import { currency, EmptyState } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/listings")({
  component: AdminListings,
});

const FILTERS: { value: AdminListingFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Live" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

function AdminListings() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<AdminListingFilter>("pending");
  const { data: listings = [], isLoading, error } = useAdminListings(isAdmin, filter);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
  }

  async function moderate(id: string, status: "approved" | "rejected" | "pending" | "archived") {
    const { error: err } = await supabase.from("listings").update({ status }).eq("id", id);
    if (err) {
      toast.error(err.message);
      return;
    }
    refresh();
    toast.success(`Listing marked ${status}`);
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from("listings").delete().eq("id", id);
    if (err) {
      toast.error(err.message);
      return;
    }
    refresh();
    toast.success("Listing deleted");
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-extrabold">Listings queue</h2>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === f.value
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : listings.length === 0 ? (
        <EmptyState
          variant="happy"
          title={filter === "pending" ? "Queue is clear" : "Nothing here"}
          description={
            filter === "pending"
              ? "No listings waiting for review right now."
              : "No listings match this filter."
          }
        />
      ) : (
        listings.map((l) => {
          const image = [...(l.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
          const seller = (l.profiles as { full_name: string } | null)?.full_name ?? "Student";
          return (
            <div key={l.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                {image && <img src={image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-1 font-semibold">{l.title}</p>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                    {l.status}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {seller} · {l.type} · {String(l.condition).replace("_", " ")}
                </p>
                <p className="font-display font-bold text-primary">{currency(l.price)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {l.status !== "approved" && (
                    <Button size="sm" className="h-8 rounded-full" onClick={() => moderate(l.id, "approved")}>
                      Approve
                    </Button>
                  )}
                  {l.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-full"
                      onClick={() => moderate(l.id, "rejected")}
                    >
                      Reject
                    </Button>
                  )}
                  {l.status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-full"
                      onClick={() => moderate(l.id, "pending")}
                    >
                      Send back to review
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-full text-destructive hover:text-destructive"
                    onClick={() => remove(l.id)}
                  >
                    Delete
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
