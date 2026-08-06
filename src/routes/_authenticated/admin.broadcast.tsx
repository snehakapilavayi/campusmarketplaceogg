import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logAdminAction, notifyUsers } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Segment = "all" | "verified" | "sellers";

const segments: { value: Segment; label: string; hint: string }[] = [
  { value: "all", label: "Everyone", hint: "All active students" },
  { value: "verified", label: "Verified only", hint: "Students with a verified profile" },
  { value: "sellers", label: "Active sellers", hint: "Students with a live listing" },
];

export const Route = createFileRoute("/_authenticated/admin/broadcast")({
  head: () => ({
    meta: [
      { title: "Announcements — SwapSpace admin" },
      { name: "description", content: "Send in-app announcements to SwapSpace students." },
      { property: "og:title", content: "Announcements — SwapSpace admin" },
      { property: "og:description", content: "Send in-app announcements to students." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BroadcastPage,
});

function BroadcastPage() {
  const { userId } = useAuth();
  const [segment, setSegment] = useState<Segment>("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: recipients = [] } = useQuery({
    queryKey: ["broadcast-recipients", segment],
    queryFn: async () => {
      if (segment === "sellers") {
        const { data, error } = await supabase.from("listings").select("seller_id").eq("status", "approved");
        if (error) throw error;
        return [...new Set((data ?? []).map((r) => r.seller_id))];
      }
      let q = supabase.from("profiles").select("id").eq("suspended", false);
      if (segment === "verified") q = q.eq("verification", "verified");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r) => r.id);
    },
  });

  async function send() {
    if (!title.trim()) {
      toast.error("Add a title");
      return;
    }
    if (recipients.length === 0) {
      toast.error("No students in this segment");
      return;
    }

    try {
      await notifyUsers(
        recipients.map((id) => ({ userId: id, title: title.trim(), message: message.trim() || null, icon: "megaphone" })),
      );
      await logAdminAction(userId, "broadcast.send", `${segment} · ${recipients.length} · ${title.trim()}`);
      toast.success(`Sent to ${recipients.length} students`);
      setTitle("");
      setMessage("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-xl font-extrabold">Announcements</h1>
        <p className="text-sm text-muted-foreground">Push an in-app notification to a group of students.</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {segments.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSegment(s.value)}
              className={
                "rounded-xl border px-4 py-3 text-left transition-colors " +
                (segment === s.value
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted")
              }
            >
              <p className="text-sm font-semibold">{s.label}</p>
              <p className="text-xs">{s.hint}</p>
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Exam-week swap drive" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message</Label>
            <Textarea
              rows={4}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="List your old notes this week and get featured on the home page."
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Megaphone className="h-3.5 w-3.5 text-primary" />
              {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
            </p>
            <Button className="rounded-full" disabled={sending} onClick={() => void send()}>
              <Send className="mr-1.5 h-4 w-4" /> {sending ? "Sending…" : "Send announcement"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
