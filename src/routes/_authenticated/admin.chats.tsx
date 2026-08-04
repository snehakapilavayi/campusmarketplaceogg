import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logAdminAction, relativeTime, useConversationMessages, useReportedConversations } from "@/lib/admin";
import { EmptyState } from "@/components/brand";
import { ConversationSkeleton, MessageSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/chats")({
  component: AdminChats,
});

type Conv = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string | null;
  created_at: string;
  listings?: { title: string } | null;
};

function AdminChats() {
  const { isAdmin, userId } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading, error } = useReportedConversations(isAdmin);
  const conversations = (data ?? []) as unknown as Conv[];

  const ids = [...new Set(conversations.flatMap((c) => [c.buyer_id, c.seller_id]))];
  const { data: names } = useQuery({
    queryKey: ["admin-chat-names", ids.join(",")],
    enabled: isAdmin && ids.length > 0,
    queryFn: async () => {
      const { data: rows } = await supabase.from("profiles").select("id,full_name,suspended").in("id", ids);
      return new Map((rows ?? []).map((r) => [r.id, r]));
    },
  });

  const { data: messages = [], isLoading: loadingMessages } = useConversationMessages(open);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-chats"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
  }

  async function dismiss(id: string) {
    const { error: err } = await supabase.from("conversations").update({ reported: false }).eq("id", id);
    if (err) {
      toast.error(err.message);
      return;
    }
    await logAdminAction(userId, "chat.report_dismissed", id);
    setOpen(null);
    refresh();
    toast.success("Report dismissed");
  }

  async function removeThread(id: string) {
    const { error: mErr } = await supabase.from("messages").delete().eq("conversation_id", id);
    if (mErr) {
      toast.error(mErr.message);
      return;
    }
    const { error: err } = await supabase.from("conversations").delete().eq("id", id);
    if (err) {
      toast.error(err.message);
      return;
    }
    await logAdminAction(userId, "chat.deleted", id);
    setOpen(null);
    refresh();
    toast.success("Conversation deleted");
  }

  async function suspend(id: string, name: string) {
    const { error: err } = await supabase.from("profiles").update({ suspended: true }).eq("id", id);
    if (err) {
      toast.error(err.message);
      return;
    }
    await logAdminAction(userId, "student.suspended", id);
    queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    queryClient.invalidateQueries({ queryKey: ["admin-chat-names"] });
    queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
    toast.success(`${name} suspended`);
  }

  const active = conversations.find((c) => c.id === open);

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-extrabold">Reported chats</h2>
      <p className="text-xs text-muted-foreground">
        Only conversations a student has reported are visible here. Private chats stay private.
      </p>

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      {isLoading ? (
        <ConversationSkeleton count={3} />
      ) : conversations.length === 0 ? (
        <EmptyState variant="happy" title="No reported chats" description="Nobody has flagged a conversation." />
      ) : active ? (
        <div className="space-y-3">
          <Button size="sm" variant="ghost" className="h-8 rounded-full" onClick={() => setOpen(null)}>
            ← Back to reported chats
          </Button>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">{active.listings?.title ?? "Deleted listing"}</p>
            <p className="text-[11px] text-muted-foreground">
              {names?.get(active.buyer_id)?.full_name ?? "Buyer"} ↔ {names?.get(active.seller_id)?.full_name ?? "Seller"}
            </p>
            <div className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto rounded-xl bg-muted/40 p-3">
              {loadingMessages ? (
                <MessageSkeleton />
              ) : messages.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">No messages in this thread.</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn("flex", m.sender_id === active.buyer_id ? "justify-start" : "justify-end")}
                  >
                    <div className="max-w-[80%] rounded-2xl bg-card px-3 py-2 shadow-sm">
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        {names?.get(m.sender_id)?.full_name ?? "Student"} · {relativeTime(m.created_at)}
                      </p>
                      {m.content && <p className="text-sm">{m.content}</p>}
                      {m.image_url && <img src={m.image_url} alt="" className="mt-1 max-h-40 rounded-lg" />}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" className="h-8 rounded-full" onClick={() => void dismiss(active.id)}>
                Dismiss report
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-full"
                onClick={() => void suspend(active.buyer_id, names?.get(active.buyer_id)?.full_name ?? "Buyer")}
              >
                Suspend buyer
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-full"
                onClick={() => void suspend(active.seller_id, names?.get(active.seller_id)?.full_name ?? "Seller")}
              >
                Suspend seller
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-full text-destructive hover:text-destructive"
                onClick={() => void removeThread(active.id)}
              >
                Delete thread
              </Button>
            </div>
          </div>
        </div>
      ) : (
        conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => setOpen(c.id)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{c.listings?.title ?? "Deleted listing"}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {names?.get(c.buyer_id)?.full_name ?? "Buyer"} ↔ {names?.get(c.seller_id)?.full_name ?? "Seller"}
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(c.created_at)}</span>
          </button>
        ))
      )}
    </div>
  );
}
