import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SwapCoin } from "@/components/brand";
import { celebrate, haptic } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type SoldTarget = { id: string; title: string };

/** Marks a listing sold (records buyer + timestamp) and then unlocks the rating flow. */
export function MarkSoldDialog({
  target,
  sellerId,
  onClose,
}: {
  target: SoldTarget | null;
  sellerId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"buyer" | "rate">("buyer");
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scores, setScores] = useState({ communication: 5, accuracy: 5, experience: 5 });
  const [review, setReview] = useState("");

  const { data: buyers = [] } = useQuery({
    queryKey: ["listing-buyers", target?.id],
    enabled: !!target,
    queryFn: async () => {
      const { data: convos } = await supabase
        .from("conversations")
        .select("buyer_id")
        .eq("listing_id", target!.id);
      const ids = [...new Set((convos ?? []).map((c) => c.buyer_id))];
      if (ids.length === 0) return [];
      const { data } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", ids);
      return data ?? [];
    },
  });

  function reset() {
    setStep("buyer");
    setBuyerId(null);
    setScores({ communication: 5, accuracy: 5, experience: 5 });
    setReview("");
    onClose();
  }

  async function confirmSold() {
    if (!target) return;
    setBusy(true);
    const { error } = await supabase
      .from("listings")
      .update({ status: "completed", sold_at: new Date().toISOString(), buyer_id: buyerId })
      .eq("id", target.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    celebrate();
    haptic([10, 40, 10]);
    queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
    toast.success("Marked as sold 🎉");
    if (buyerId) setStep("rate");
    else reset();
  }

  async function submitRating() {
    if (!target || !buyerId) return reset();
    setBusy(true);
    const swapcoins = Number(
      ((scores.communication + scores.accuracy + scores.experience) / 3).toFixed(1),
    );
    const { error } = await supabase.from("ratings").insert({
      reviewer_id: sellerId,
      reviewed_id: buyerId,
      listing_id: target.id,
      ...scores,
      swapcoins,
      review: review.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Thanks for rating your buyer!");
    reset();
  }

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && reset()}>
      <DialogContent className="max-w-md">
        {step === "buyer" ? (
          <>
            <DialogHeader>
              <DialogTitle>Mark “{target?.title}” as sold?</DialogTitle>
              <DialogDescription>
                It stays in your history but disappears from the marketplace. Pick who bought it to leave a rating.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {buyers.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBuyerId(b.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition",
                    buyerId === b.id ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
                  )}
                >
                  <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-accent font-display font-bold">
                    {b.avatar_url ? (
                      <img src={b.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      b.full_name.charAt(0)
                    )}
                  </span>
                  <span className="font-medium">{b.full_name}</span>
                </button>
              ))}
              <button
                onClick={() => setBuyerId(null)}
                className={cn(
                  "w-full rounded-2xl border p-3 text-left text-sm transition",
                  buyerId === null ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
                )}
              >
                Sold to someone not on SwapSpace
              </button>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={reset} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={confirmSold} disabled={busy} className="rounded-full">
                {busy ? "Saving…" : "Mark as sold"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>How was the swap?</DialogTitle>
              <DialogDescription>Your rating helps everyone trade safely on campus.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {(["communication", "accuracy", "experience"] as const).map((k) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{k}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        aria-label={`${k} ${n}`}
                        onClick={() => setScores((s) => ({ ...s, [k]: n }))}
                        className={cn("transition", scores[k] >= n ? "opacity-100" : "opacity-25")}
                      >
                        <SwapCoin size={20} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Anything worth mentioning? (optional)"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={reset} disabled={busy}>
                Skip
              </Button>
              <Button onClick={submitRating} disabled={busy} className="rounded-full">
                {busy ? "Sending…" : "Submit rating"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
