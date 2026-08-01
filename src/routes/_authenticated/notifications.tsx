import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — SwapSpace" },
      { name: "description", content: "Listing approvals, new messages and campus events in one place." },
      { property: "og:title", content: "Notifications — SwapSpace" },
      { property: "og:description", content: "Approvals, messages and campus events." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function markAllRead() {
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId!).eq("read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
  }

  return (
    <AppShell title="Notifications">
      <div className="space-y-3 pt-4">
        {items.length === 0 ? (
          <EmptyState title="No notifications" description="Approvals and replies will show up here." />
        ) : (
          <>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="rounded-full" onClick={markAllRead}>
                Mark all read
              </Button>
            </div>
            {items.map((n) => (
              <div
                key={n.id}
                className={`flex gap-3 rounded-2xl border p-4 ${n.read ? "border-border bg-card" : "border-primary/40 bg-accent"}`}
              >
                <span className="text-xl">{n.icon ?? "🔔"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.message && <p className="text-sm text-muted-foreground">{n.message}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </AppShell>
  );
}
