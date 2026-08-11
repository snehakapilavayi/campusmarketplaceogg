import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Check, CheckCheck, ChevronLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { currency, DealClosedBadge } from "@/components/brand";
import { RateDialog } from "@/components/rate-dialog";
import { MessageSkeleton } from "@/components/skeletons";
import { haptic, springy } from "@/lib/motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Renders a timestamp in the viewer's own device timezone/locale (e.g. "2:14 pm").
function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}


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
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannel = useRef<RealtimeChannel | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);


  const { data: conversation } = useQuery({
    queryKey: ["conversation", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select(
          "id,buyer_id,seller_id,listings(id,title,price,type,rent_period,status,sold_at,buyer_id,listing_images(url,sort_order))",
        )
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      const otherId = data.buyer_id === userId ? data.seller_id : data.buyer_id;
      const { data: other } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url,swapcoin_rating")
        .eq("id", otherId)
        .maybeSingle();
      return { ...data, other };
    },
  });


  type Msg = {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string | null;
    image_url?: string | null;
    created_at: string;
    read_at?: string | null;
    pending?: boolean;
  };

  const messagesKey = ["messages", id];
  const { data: messages = [], isLoading } = useQuery({
    queryKey: messagesKey,
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      return (data ?? []) as Msg[];
    },
  });

  // Live messages + typing presence for this thread.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`thread-${id}`, { config: { presence: { key: userId } } })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: messagesKey }),
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.userId === userId) return;
        setOtherTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setOtherTyping(false), 2200);
      })
      .subscribe();
    typingChannel.current = channel;
    return () => {
      typingChannel.current = null;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userId, queryClient]);

  // Mark the other person's messages as seen while the thread is open.
  useEffect(() => {
    if (!userId) return;
    const unseen = messages.filter((m) => m.sender_id !== userId && !m.read_at);
    if (unseen.length === 0) return;
    supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unseen.map((m) => m.id))
      .then(() => queryClient.invalidateQueries({ queryKey: messagesKey }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, otherTyping]);

  function notifyTyping() {
    typingChannel.current?.send({ type: "broadcast", event: "typing", payload: { userId } });
  }

  async function send(content: string) {
    const text = content.trim();
    if (!text) return;
    setDraft("");
    haptic();

    // Optimistic bubble — shows instantly with a "sending" state.
    const tempId = `temp-${Date.now()}`;
    const optimistic: Msg = {
      id: tempId,
      conversation_id: id,
      sender_id: userId!,
      content: text,
      created_at: new Date().toISOString(),
      read_at: null,
      pending: true,
    };
    queryClient.setQueryData<Msg[]>(messagesKey, (prev) => [...(prev ?? []), optimistic]);

    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: id, sender_id: userId!, content: text });

    if (error) {
      queryClient.setQueryData<Msg[]>(messagesKey, (prev) => (prev ?? []).filter((m) => m.id !== tempId));
      setDraft(text);
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: messagesKey });
  }




  const listing = conversation?.listings;
  const image = [...(listing?.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  const sold = !!listing && (listing.status === "completed" || !!listing.sold_at);
  const isBuyer = conversation?.buyer_id === userId;
  const [rateOpen, setRateOpen] = useState(false);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overscroll-none bg-background">
      {/* Same soft, minimal brand wash used across the rest of the app. */}
      <div aria-hidden className="brand-pattern-subtle pointer-events-none fixed inset-0 z-0" />
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">

        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-3 sm:h-16 sm:gap-3">
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
            {sold && <DealClosedBadge soldAt={listing.sold_at} />}
          </Link>
        )}
      </header>

      <div className="relative z-10 mx-auto w-full max-w-3xl flex-1 space-y-2 px-3 py-4">
        {sold && (
          <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-2xl border border-border bg-card/90 px-4 py-3 text-center shadow-[var(--shadow-soft)] backdrop-blur">
            <DealClosedBadge soldAt={listing?.sold_at} />
            <p className="text-xs text-muted-foreground">
              This swap is complete. Meet safely and keep it kind.
            </p>
            {isBuyer && conversation && (
              <Button size="sm" className="rounded-full" onClick={() => setRateOpen(true)}>
                Rate with SwapCoins
              </Button>
            )}
          </div>
        )}

        {isLoading && <MessageSkeleton />}
        {!isLoading && messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Say hi 👋 — ask if it's still available.
          </p>
        )}
        {messages.map((m, i) => {
          const mine = m.sender_id === userId;
          const isLastMine = mine && i === messages.length - 1;
          return (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: m.pending ? 0.65 : 1, y: 0 }}
              transition={springy}
              className={cn("flex flex-col", mine ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] break-words rounded-2xl px-4 py-2 text-sm sm:max-w-[75%]",
                  mine
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-muted text-foreground",
                )}
              >
                {m.content}
              </div>
              <span className={cn("mt-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground", mine ? "pr-1" : "pl-1")}>
                <time dateTime={m.created_at}>{formatTime(m.created_at)}</time>
                {isLastMine && (
                  m.pending ? (
                    <>· Sending…</>
                  ) : m.read_at ? (
                    <>
                      · <CheckCheck className="h-3 w-3 text-primary" /> Seen
                    </>
                  ) : (
                    <>
                      · <Check className="h-3 w-3" /> Sent
                    </>
                  )
                )}
              </span>
            </motion.div>
          );
        })}
        <AnimatePresence>
          {otherTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: d * 0.18 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />

      </div>

      <div className="sticky bottom-0 z-10 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-3 py-3">
          {!isLoading && messages.length === 0 && (
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
              onChange={(e) => {
                setDraft(e.target.value);
                notifyTyping();
              }}

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

      {conversation && userId && (
        <RateDialog
          open={rateOpen}
          onClose={() => setRateOpen(false)}
          reviewerId={userId}
          reviewedId={conversation.seller_id}
          reviewedName={conversation.other?.full_name ?? "the seller"}
          listingId={listing?.id ?? null}
        />
      )}
    </div>

  );
}
