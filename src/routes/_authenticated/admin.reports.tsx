import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logAdminActions, relativeTime, useAdminReports } from "@/lib/admin";
import { downloadCsv } from "@/lib/csv";
import { EmptyState } from "@/components/brand";
import { BulkBar, ExportButton, FilterTabs, SelectAllRow } from "@/components/admin-ui";
import { ListSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  const { isAdmin, userId } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("pending");
  const [selected, setSelected] = useState<string[]>([]);
  const { data: all = [], isLoading, error } = useAdminReports(isAdmin);
  const reports = filter === "all" ? all : all.filter((r) => r.status === filter);

  async function setStatus(ids: string[], status: "under_review" | "resolved" | "rejected") {
    const { error: err } = await supabase.from("reports").update({ status }).in("id", ids);
    if (err) {
      toast.error(err.message);
      return;
    }
    await logAdminActions(userId, `report.${status}`, ids);
    queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
    setSelected([]);
    toast.success(`${ids.length} report${ids.length > 1 ? "s" : ""} updated`);
  }

  function exportCsv() {
    downloadCsv(
      "reports",
      ["Reason", "Description", "Target type", "Status", "Created"],
      reports.map((r) => [r.reason, r.description ?? "", r.target_type, r.status, new Date(r.created_at).toLocaleString()]),
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-extrabold">Reports</h2>

      <FilterTabs value={filter} onChange={(v) => { setFilter(v); setSelected([]); }} options={FILTERS} />

      <div className="flex flex-wrap items-center gap-2">
        <ExportButton onExport={exportCsv} disabled={reports.length === 0} />
      </div>

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : reports.length === 0 ? (
        <EmptyState variant="happy" title="No reports here" description="The campus is behaving today." />
      ) : (
        <>
          <SelectAllRow
            count={reports.length}
            selected={selected.length}
            onToggleAll={(c) => setSelected(c ? reports.map((r) => r.id) : [])}
          />
          {reports.map((r) => {
            const checked = selected.includes(r.id);
            return (
              <div
                key={r.id}
                className={cn("rounded-2xl border bg-card p-4", checked ? "border-primary/50" : "border-border")}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) =>
                      setSelected((prev) => (c ? [...prev, r.id] : prev.filter((id) => id !== r.id)))
                    }
                    aria-label={`Select report ${r.reason}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{r.reason}</p>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        {r.status}
                      </span>
                    </div>
                    {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Target: {r.target_type} · {relativeTime(r.created_at)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status === "pending" && (
                    <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => void setStatus([r.id], "under_review")}>
                      Start review
                    </Button>
                  )}
                  {r.status !== "resolved" && (
                    <Button size="sm" className="h-8 rounded-full" onClick={() => void setStatus([r.id], "resolved")}>
                      Mark resolved
                    </Button>
                  )}
                  {r.status !== "rejected" && (
                    <Button size="sm" variant="ghost" className="h-8 rounded-full" onClick={() => void setStatus([r.id], "rejected")}>
                      Dismiss
                    </Button>
                  )}
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
          { label: "Start review", run: async () => { await setStatus(selected, "under_review"); } },
          { label: "Resolve", run: async () => { await setStatus(selected, "resolved"); } },
          { label: "Dismiss", destructive: true, run: async () => { await setStatus(selected, "rejected"); } },
        ]}
      />
    </div>
  );
}
