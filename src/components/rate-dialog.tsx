import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { cn } from "@/lib/utils";

/** Shared SwapCoin rating dialog used after a deal is closed. */
export function RateDialog({
  open,
  onClose,
  reviewerId,
  reviewedId,
  reviewedName,
  listingId,
}: {
  open: boolean;
  onClose: () => void;
  reviewerId: string;
  reviewedId: string;
  reviewedName: string;
  listingId?: string | null;
}) {
  const queryClient = useQueryClient();
  const [scores, setScores] = useState({ communication: 5, accuracy: 5, experience: 5 });
  const [review, setReview] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const swapcoins = Number(((scores.communication + scores.accuracy + scores.experience) / 3).toFixed(1));
    const { error } = await supabase.from("ratings").insert({
      reviewer_id: reviewerId,
      reviewed_id: reviewedId,
      listing_id: listingId ?? null,
      ...scores,
      swapcoins,
      review: review.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["my-rating"] });
    queryClient.invalidateQueries({ queryKey: ["deals"] });
    toast.success("Thanks for rating your swap!");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>How was the swap with {reviewedName}?</DialogTitle>
          <DialogDescription>Your SwapCoins help everyone trade safely on campus.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {(["communication", "accuracy", "experience"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-sm capitalize">{k}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${k} ${n}`}
                    onClick={() => setScores((s) => ({ ...s, [k]: n }))}
                    className={cn("transition hover:scale-110", scores[k] >= n ? "opacity-100" : "opacity-25")}
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
          <Button variant="ghost" className="rounded-full" onClick={onClose} disabled={busy}>
            Skip
          </Button>
          <Button className="rounded-full" onClick={submit} disabled={busy}>
            {busy ? "Sending…" : "Submit rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
