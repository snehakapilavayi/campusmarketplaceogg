import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { currency, EmptyState } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin portal — SwapSpace" },
      { name: "description", content: "Moderate listings, students and reports across the campus marketplace." },
      { property: "og:title", content: "Admin portal — SwapSpace" },
      { property: "og:description", content: "Moderate listings, students and reports." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: pending = [] } = useQuery({
    queryKey: ["admin-pending"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("id,title,price,type,created_at,seller_id,listing_images(url,sort_order)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["admin-reports"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["admin-students"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,verification,tomato_rating,transactions_count,suspended")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  if (!isAdmin) {
    return (
      <AppShell title="Admin">
        <EmptyState
          title="Admins only"
          description="This area is limited to the SwapSpace moderation team."
          action={
            <Button asChild className="mt-2 rounded-full">
              <Link to="/market">Back to market</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  async function moderate(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("listings").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
    toast.success(status === "approved" ? "Listing approved" : "Listing rejected");
  }

  async function resolveReport(id: string) {
    await supabase.from("reports").update({ status: "resolved" }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    toast.success("Report resolved");
  }

  async function verify(id: string) {
    await supabase.from("profiles").update({ verification: "verified" }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    toast.success("Student verified");
  }

  return (
    <AppShell title="Admin portal">
      <div className="pt-4">
        <div className="mb-4 grid grid-cols-3 gap-2">
          <KPI label="Pending" value={pending.length} />
          <KPI label="Reports" value={reports.length} />
          <KPI label="Students" value={students.length} />
        </div>

        <Tabs defaultValue="listings">
          <TabsList className="w-full">
            <TabsTrigger value="listings" className="flex-1">
              Listings
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1">
              Reports
            </TabsTrigger>
            <TabsTrigger value="students" className="flex-1">
              Students
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-3 pt-4">
            {pending.length === 0 ? (
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
          </TabsContent>

          <TabsContent value="reports" className="space-y-3 pt-4">
            {reports.length === 0 ? (
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
          </TabsContent>

          <TabsContent value="students" className="space-y-2 pt-4">
            {students.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-accent font-display font-bold">
                  {s.full_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.verification} · 🍅 {Number(s.tomato_rating).toFixed(1)} · {s.transactions_count} swaps
                  </p>
                </div>
                {s.verification !== "verified" && (
                  <Button size="sm" variant="outline" className="h-8 shrink-0 rounded-full" onClick={() => verify(s.id)}>
                    Verify
                  </Button>
                )}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function KPI({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <p className="font-display text-xl font-extrabold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
