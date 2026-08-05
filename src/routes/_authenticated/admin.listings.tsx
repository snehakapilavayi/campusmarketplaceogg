import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  campusOptions,
  logAdminActions,
  notifyUsers,
  useAdminCategories,
  useAdminListings,
  type AdminListingFilter,
} from "@/lib/admin";
import { downloadCsv } from "@/lib/csv";
import { currency, EmptyState } from "@/components/brand";
import {
  BulkBar,
  CampusSelect,
  CategorySelect,
  ExportButton,
  FilterTabs,
  RejectDialog,
  SelectAllRow,
} from "@/components/admin-ui";
import { ListSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/listings")({
  component: AdminListings,
});

const FILTERS: { value: AdminListingFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Live" },
  { value: "featured", label: "Featured" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

type Row = {
  id: string;
  title: string;
  price: number | string;
  type: string;
  status: string;
  condition: string;
  featured: boolean;
  created_at: string;
  seller_id: string;
  category_id: string | null;
  rejection_reason: string | null;
  resubmit_by: string | null;
  listing_images?: { url: string; sort_order: number }[] | null;
  profiles?: { full_name: string; verification: string; campus: string | null } | null;
};

function AdminListings() {
  const { isAdmin, userId } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<AdminListingFilter>("pending");
  const [campus, setCampus] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [rejecting, setRejecting] = useState<string[] | null>(null);
  const { data, isLoading, error } = useAdminListings(isAdmin, filter);
  const { data: categories = [] } = useAdminCategories(isAdmin);
  const listings = (data ?? []) as unknown as Row[];

  const campuses = useMemo(() => campusOptions(listings.map((l) => ({ campus: l.profiles?.campus }))), [listings]);

  const visible = useMemo(
    () =>
      listings.filter((l) => {
        if (campus === "all") return true;
        if (campus === "__none") return !l.profiles?.campus;
        return l.profiles?.campus === campus;
      }),
    [listings, campus],
  );

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
    queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    setSelected([]);
  }

  function rowsFor(ids: string[]) {
    return listings.filter((l) => ids.includes(l.id));
  }

  async function moderate(ids: string[], status: "approved" | "rejected" | "pending" | "archived") {
    const { error: err } = await supabase
      .from("listings")
      .update({ status, ...(status === "approved" ? { rejection_reason: null, resubmit_by: null } : {}) })
      .in("id", ids);
    if (err) {
      toast.error(err.message);
      return;
    }
    await logAdminActions(userId, `listing.${status}`, ids);
    if (status === "approved") {
      await notifyUsers(
        rowsFor(ids).map((l) => ({
          userId: l.seller_id,
          title: "Listing approved",
          message: `"${l.title}" is now live on the market.`,
          icon: "check",
        })),
      );
    }
    refresh();
    toast.success(`${ids.length} listing${ids.length > 1 ? "s" : ""} marked ${status}`);
  }

  async function rejectWithReason(ids: string[], reason: string, deadline: string | null) {
    const targets = rowsFor(ids);
    const { error: err } = await supabase
      .from("listings")
      .update({ status: "rejected", rejection_reason: reason, resubmit_by: deadline })
      .in("id", ids);
    if (err) {
      toast.error(err.message);
      return;
    }
    const byText = deadline ? ` Resubmit by ${new Date(deadline).toLocaleDateString()}.` : "";
    await logAdminActions(userId, `listing.rejected — ${reason}${byText}`, ids);
    await notifyUsers(
      targets.map((l) => ({
        userId: l.seller_id,
        title: "Listing needs changes",
        message: `"${l.title}" was rejected: ${reason}.${
          deadline
            ? ` Fix it and resubmit before ${new Date(deadline).toLocaleDateString()}.`
            : " Edit and resubmit it any time."
        }`,
        icon: "alert",
      })),
    );
    refresh();
    toast.success(`${ids.length} listing${ids.length > 1 ? "s" : ""} rejected and student notified`);
  }

  async function reassignCategory(l: Row, categoryId: string) {
    const { error: err } = await supabase.from("listings").update({ category_id: categoryId }).eq("id", l.id);
    if (err) {
      toast.error(err.message);
      return;
    }
    const name = categories.find((c) => c.id === categoryId)?.name ?? "another category";
    await logAdminActions(userId, `listing.category → ${name}`, [l.id]);
    await notifyUsers([
      {
        userId: l.seller_id,
        title: "Listing recategorised",
        message: `"${l.title}" was moved to ${name}.`,
        icon: "tag",
      },
    ]);
    refresh();
    toast.success(`Moved to ${name}`);
  }

  async function remove(ids: string[]) {
    const { error: err } = await supabase.from("listings").delete().in("id", ids);
    if (err) {
      toast.error(err.message);
      return;
    }
    await logAdminActions(userId, "listing.deleted", ids);
    refresh();
    toast.success(`${ids.length} listing${ids.length > 1 ? "s" : ""} deleted`);
  }

  async function toggleFeatured(l: Row) {
    const { error: err } = await supabase.from("listings").update({ featured: !l.featured }).eq("id", l.id);
    if (err) {
      toast.error(err.message);
      return;
    }
    await logAdminActions(userId, l.featured ? "listing.unfeatured" : "listing.featured", [l.id]);
    refresh();
    toast.success(l.featured ? "Removed from featured" : "Featured on the market");
  }

  function exportCsv() {
    downloadCsv(
      "listings",
      ["Title", "Seller", "Campus", "Type", "Status", "Featured", "Condition", "Price", "Created"],
      visible.map((l) => [
        l.title,
        l.profiles?.full_name ?? "",
        l.profiles?.campus ?? "",
        l.type,
        l.status,
        l.featured ? "yes" : "no",
        String(l.condition).replace("_", " "),
        l.price,
        new Date(l.created_at).toLocaleString(),
      ]),
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-extrabold">Listings queue</h2>

      <FilterTabs value={filter} onChange={(v) => { setFilter(v); setSelected([]); }} options={FILTERS} />

      <div className="flex flex-wrap items-center gap-2">
        <CampusSelect value={campus} onChange={setCampus} options={campuses} />
        <ExportButton onExport={exportCsv} disabled={visible.length === 0} />
      </div>

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : visible.length === 0 ? (
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
        <>
          <SelectAllRow
            count={visible.length}
            selected={selected.length}
            onToggleAll={(c) => setSelected(c ? visible.map((l) => l.id) : [])}
          />
          {visible.map((l) => {
            const image = [...(l.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
            const checked = selected.includes(l.id);
            return (
              <div
                key={l.id}
                className={cn(
                  "flex gap-3 rounded-2xl border bg-card p-3",
                  checked ? "border-primary/50" : "border-border",
                )}
              >
                <div className="flex flex-col items-center gap-2">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) =>
                      setSelected((prev) => (c ? [...prev, l.id] : prev.filter((id) => id !== l.id)))
                    }
                    aria-label={`Select ${l.title}`}
                  />
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {image && <img src={image} alt="" className="h-full w-full object-cover" />}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 font-semibold">{l.title}</p>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        {l.status}
                      </span>
                      {l.status === "approved" && (
                        <button
                          onClick={() => void toggleFeatured(l)}
                          aria-label={l.featured ? "Unfeature listing" : "Feature listing"}
                          className="rounded-full p-1 hover:bg-muted"
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              l.featured ? "fill-primary text-primary" : "text-muted-foreground",
                            )}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {l.profiles?.full_name ?? "Student"}
                    {l.profiles?.campus ? ` · ${l.profiles.campus}` : ""} · {l.type} ·{" "}
                    {String(l.condition).replace("_", " ")}
                  </p>
                  <p className="font-display font-bold text-primary">{currency(l.price)}</p>
                  {l.status === "rejected" && l.rejection_reason && (
                    <p className="mt-1 rounded-lg bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
                      Reason: {l.rejection_reason}
                      {l.resubmit_by && (
                        <span className="block font-semibold">
                          Resubmit by {new Date(l.resubmit_by).toLocaleDateString()}
                          {new Date(l.resubmit_by).getTime() < Date.now() ? " · deadline passed" : ""}
                        </span>
                      )}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {l.status !== "approved" && (
                      <Button size="sm" className="h-8 rounded-full" onClick={() => void moderate([l.id], "approved")}>
                        Approve
                      </Button>
                    )}
                    {l.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full"
                        onClick={() => setRejecting([l.id])}
                      >
                        Reject
                      </Button>
                    )}
                    {l.status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full"
                        onClick={() => void moderate([l.id], "pending")}
                      >
                        Send back
                      </Button>
                    )}
                    <CategorySelect
                      value={l.category_id}
                      options={categories}
                      onChange={(id) => void reassignCategory(l, id)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-full text-destructive hover:text-destructive"
                      onClick={() => void remove([l.id])}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      <BulkBar
        count={selected.length}
        onClear={() => setSelected([])}
        actions={[
          { label: "Approve", run: async () => { await moderate(selected, "approved"); } },
          { label: "Reject", run: () => setRejecting(selected) },
          { label: "Delete", destructive: true, description: "Deleted listings cannot be restored.", run: async () => { await remove(selected); } },
        ]}
      />

      <RejectDialog
        open={rejecting !== null}
        onOpenChange={(v) => setRejecting(v ? rejecting : null)}
        count={rejecting?.length ?? 0}
        onConfirm={async (reason, deadline) => {
          if (rejecting) await rejectWithReason(rejecting, reason, deadline);
        }}
      />
    </div>
  );
}
