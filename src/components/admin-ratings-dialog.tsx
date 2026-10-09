import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/admin";
import { CoinRating } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Admin view of every rating a student received, with hide-with-reason. */
export function AdminRatingsDialog({
  student,
  adminId,
  onClose,
}: {
  student: { id: string; full_name: string } | null;
  adminId: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [hiding, setHiding] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: ratings = [], isLoading } = useQuery({
    queryKey: ["admin-ratings", student?.id],
    enabled: !!student,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ratings")
        .select("id,reviewer_id,communication,accuracy,experience,swapcoins,review,created_at,hidden,hidden_reason")
        .eq("reviewed_id", student!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const { data: cards } = rows.length
        ? await supabase.rpc("get_public_profile_cards", { _ids: [...new Set(rows.map((r) => r.reviewer_id))] })
        : { data: [] };
      const names = new Map((cards ?? []).map((c) => [c.id, c.full_name]));
      return rows.map((r) => ({ ...r, reviewer_name: names.get(r.reviewer_id) ?? "Student" }));
    },
  });

  async function hide(id: string) {
    if (reason.trim().length < 5) return;
    setBusy(true);
    const { error } = await supabase
      .from("ratings")
      .update({ hidden: true, hidden_reason: reason.trim(), hidden_by: adminId })
      .eq("id", id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAdminAction(adminId, `rating.hidden — ${reason.trim()}`, id);
    toast.success("Review hidden — it no longer counts toward their score");
    setHiding(null);
    setReason("");
    queryClient.invalidateQueries({ queryKey: ["admin-ratings", student?.id] });
    queryClient.invalidateQueries({ queryKey: ["admin-students"] });
  }

  return (
    <Dialog open={!!student} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>SwapCoins for {student?.full_name}</DialogTitle>
          <DialogDescription>Every rating this student received. Hide abusive reviews with a reason.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : ratings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ratings yet.</p>
        ) : (
          <div className="space-y-2">
            {ratings.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{r.reviewer_name}</span>
                  <CoinRating value={Number(r.swapcoins)} className="text-[10px]" />
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Communication {r.communication} · Accuracy {r.accuracy} · Experience {r.experience} ·{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
                {r.review && <p className="mt-1 text-sm">{r.review}</p>}
                {r.hidden ? (
                  <p className="mt-2 text-xs font-semibold text-destructive">Hidden — {r.hidden_reason}</p>
                ) : hiding === r.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why is this review being hidden?"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setHiding(null)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busy || reason.trim().length < 5}
                        onClick={() => void hide(r.id)}
                      >
                        Hide review
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="mt-2 h-7 rounded-full" onClick={() => setHiding(r.id)}>
                    Hide
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
