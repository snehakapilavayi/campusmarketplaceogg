import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { currency } from "@/components/brand";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat/$id")({
  head: () => ({
    meta: [
      { title: "Conversation — SwapSpace" },
      { name: "description", content: "Agree on a time and place to swap on campus." },
      { property: "og:title", content: "Conversation — SwapSpace" },
      { property: "og:description", content: "Agree on a campus meeting spot." },
    ],
  }),
  component: Conversation,
});

const quickReplies = ["Is this still available?", "Can we meet at the canteen?", "Is the price negotiable?"];

function Conversation() {
  const { id } = Route.useParams();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversation } = useQuery({
    queryKey: ["conversation", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id,buyer_id,seller_id,listings(id,title,price,type,rent_period,listing_images(url,sort_order))")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      const otherId = data.buyer_id === userId ? data.seller_id : data.buyer_id;
      const { data: other } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url,tomato_rating")
        .eq("id", otherId)
        .maybeSingle();
      return { ...data, other };
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: ["messages", id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(content: string) {
    const text = content.trim();
    if (!text) return;
    setDraft("");
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: id, sender_id: userId!, content: text });
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["messages", id] });
  }

  const listing = conversation?.listings;
  const image = [...(listing?.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-3">
          <Link to="/chat" className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted" aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{conversation?.other?.full_name ?? "Student"}</p>
            <p className="truncate text-xs text-muted-foreground">Meet on campus, pay in person</p>
          </div>
        </div>
        {listing && (
          <Link
            to="/listing/$id"
            params={{ id: listing.id }}
            className="mx-auto flex max-w-3xl items-center gap-3 border-t border-border px-3 py-2 hover:bg-muted/50"
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
              {image && <img src={image} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{listing.title}</p>
              <p className="text-xs font-bold text-primary">
                {currency(listing.price)}
                {listing.type === "rent" && <span className="font-medium text-muted-foreground">/{listing.rent_period ?? "day"}</span>}
              </p>
            </div>
          </Link>
        )}
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-2 px-3 py-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Say hi 👋 — ask if it's still available.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  mine
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-muted text-foreground",
                )}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-3 py-3">
          {messages.length === 0 && (
            <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="flex gap-2"
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              maxLength={500}
              className="h-11 rounded-full"
            />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-full" aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
