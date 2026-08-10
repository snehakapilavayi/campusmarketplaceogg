import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ListSkeleton } from "@/components/skeletons";
import { currency, EmptyState } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { celebrate, haptic } from "@/lib/motion";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_authenticated/my-listings")({
  head: () => ({
    meta: [
      { title: "My listings — SwapSpace" },
      { name: "description", content: "Track your live, pending and completed campus listings." },
      { property: "og:title", content: "My listings — SwapSpace" },
      { property: "og:description", content: "Track your live, pending and completed listings." },
    ],
  }),
  component: MyListings,
});

const statusStyles: Record<string, string> = {
  approved: "bg-success text-success-foreground",
  pending: "bg-primary text-primary-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  completed: "bg-secondary text-secondary-foreground",
  archived: "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
};

function isExpired(deadline: string | null) {
  return !!deadline && new Date(deadline).getTime() < Date.now();
}

function deadlineNote(deadline: string | null) {
  if (!deadline) return "Fix it and resubmit whenever you're ready — no deadline.";
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms < 0) return "The resubmission deadline has passed. Post a fresh listing instead.";
  const days = Math.ceil(ms / 86400000);
  return `Resubmit by ${new Date(deadline).toLocaleDateString()} — ${days} day${days === 1 ? "" : "s"} left.`;
}

function MyListings() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);


  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["my-listings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("id,title,price,type,rent_period,status,rejection_reason,resubmit_by,listing_images(url,sort_order)")
        .eq("seller_id", userId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function resubmit(id: string, deadline: string | null) {
    if (deadline && new Date(deadline).getTime() < Date.now()) {
      toast.error("The resubmission deadline has passed. Create a fresh listing instead.");
      return;
    }
    const { error } = await supabase
      .from("listings")
      .update({ status: "approved", rejection_reason: null, resubmit_by: null })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
    toast.success("Listing is live again 🎉");
  }

  async function updateStatus(id: string, status: "completed" | "archived") {
    const { error } = await supabase.from("listings").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    if (status === "completed") {
      celebrate();
      haptic([10, 40, 10]);
    }
    toast.success(status === "completed" ? "Marked as sold 🎉" : "Listing archived");

  }

  async function deleteListing() {
    if (!pendingDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("listings").delete().eq("id", pendingDelete.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPendingDelete(null);
    queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
    toast.success("Listing deleted");
  }



  return (
    <AppShell title="My listings">
      <div className="space-y-3 pt-4">
        {isLoading ? (
          <ListSkeleton count={3} />
        ) : listings.length === 0 ? (
          <EmptyState
            variant="idea"
            title="You haven't listed anything"
            description="That spare lamp or last semester's textbook could be someone's find today."
            action={
              <Button asChild className="mt-2 rounded-full">
                <Link to="/sell">List an item</Link>
              </Button>
            }
          />
        ) : (
          listings.map((l) => {
            const image = [...(l.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
            return (
              <div key={l.id} className="flex gap-3 rounded-2xl border border-border bg-card p-2.5 shadow-[var(--shadow-soft)] sm:p-3">
                <Link to="/listing/$id" params={{ id: l.id }} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {image && <img src={image} alt="" className="h-full w-full object-cover" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 font-semibold">{l.title}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        statusStyles[l.status] ?? "bg-muted",
                      )}
                    >
                      {l.status}
                    </span>
                  </div>
                  <p className="font-display font-bold text-primary">
                    {currency(l.price)}
                    {l.type === "rent" && (
                      <span className="text-xs text-muted-foreground">/{l.rent_period ?? "day"}</span>
                    )}
                  </p>
                  {l.status === "rejected" && (
                    <div className="mt-1.5 rounded-xl bg-destructive/10 px-2.5 py-1.5">
                      <p className="text-[11px] font-semibold text-destructive">Why it was rejected</p>
                      <p className="text-[11px] text-destructive/90">
                        {l.rejection_reason ?? "An admin asked for changes before this can go live."}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-destructive">
                        {deadlineNote(l.resubmit_by)}
                      </p>
                      <div className="mt-1.5 flex gap-2">
                        <Button asChild size="sm" variant="outline" className="h-7 rounded-full text-[11px]">
                          <Link to="/sell">Edit &amp; relist</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-full text-[11px]"
                          disabled={isExpired(l.resubmit_by)}
                          onClick={() => resubmit(l.id, l.resubmit_by)}
                        >
                          Publish again
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {(l.status === "approved" || l.status === "pending") && (
                      <>
                        <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => updateStatus(l.id, "completed")}>
                          Mark sold
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 rounded-full text-muted-foreground"
                          onClick={() => updateStatus(l.id, "archived")}
                        >
                          Archive
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setPendingDelete({ id: l.id, title: l.title })}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.title}” will be removed from SwapSpace for good, along with its photos, saves and
              cart entries. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                deleteListing();
              }}
            >
              {deleting ? "Deleting…" : "Delete listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>

  );
}
