import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAdminReports } from "@/lib/admin";
import { EmptyState } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: AdminReports,
});

type Filter = "pending" | "under_review" | "resolved" | "rejected" | "all";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "pending", label: "Open" },
  { value: "under_review", label: "Reviewing" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
];

function AdminReports() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("pending");
  const { data: all = [], isLoading, error } = useAdminReports(isAdmin);
  const reports = filter === "all" ? all : all.filter((r) => r.status === filter);

  async function setStatus(id: string, status: "under_review" | "resolved" | "rejected") {
    const { error: err } = await supabase.from("reports").update({ status }).eq("id", id);
    if (err) {
      toast.error(err.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    toast.success("Report updated");
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-extrabold">Reports</h2>

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
      ) : reports.length === 0 ? (
        <EmptyState variant="happy" title="No reports here" description="The campus is behaving today." />
      ) : (
        reports.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold">{r.reason}</p>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                {r.status}
              </span>
            </div>
            {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
            <p className="mt-1 text-[11px] text-muted-foreground">Target: {r.target_type}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.status === "pending" && (
                <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => setStatus(r.id, "under_review")}>
                  Start review
                </Button>
              )}
              {r.status !== "resolved" && (
                <Button size="sm" className="h-8 rounded-full" onClick={() => setStatus(r.id, "resolved")}>
                  Mark resolved
                </Button>
              )}
              {r.status !== "rejected" && (
                <Button size="sm" variant="ghost" className="h-8 rounded-full" onClick={() => setStatus(r.id, "rejected")}>
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
