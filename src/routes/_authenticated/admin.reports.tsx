import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAdminReports } from "@/lib/admin";
import { EmptyState } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: AdminReports,
});

function AdminReports() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: reports = [], isLoading } = useAdminReports(isAdmin);

  async function resolveReport(id: string) {
    const { error } = await supabase.from("reports").update({ status: "resolved" }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    toast.success("Report resolved");
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-extrabold">Reports</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : reports.length === 0 ? (
        <EmptyState variant="happy" title="No open reports" description="The campus is behaving today." />
      ) : (
        reports.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">{r.reason}</p>
            {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
            <p className="mt-1 text-[11px] text-muted-foreground">Target: {r.target_type}</p>
            <Button size="sm" variant="outline" className="mt-3 h-8 rounded-full" onClick={() => resolveReport(r.id)}>
              Mark resolved
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
