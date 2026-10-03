import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/policies")({
  component: AdminPolicies,
});

type Policies = {
  prohibited_items: string[];
  report_sla_hours: number;
  fresher_handling: string;
  max_rental_days: number;
  deposit_guidance: string;
};

const DEFAULTS: Policies = {
  prohibited_items: ["Alcohol", "Tobacco & vapes", "Weapons", "Medicines", "Exam papers"],
  report_sla_hours: 48,
  fresher_handling: "Freshers join with Gmail through the freshers link and are approved by their College Admin.",
  max_rental_days: 120,
  deposit_guidance: "Keep deposits under the item's resale value and agree on them in chat before handover.",
};

function AdminPolicies() {
  const { userId, isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-policies"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "policies").maybeSingle();
      return { ...DEFAULTS, ...((data?.value as Partial<Policies>) ?? {}) };
    },
  });
  const [p, setP] = useState<Policies>(DEFAULTS);
  const [items, setItems] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data) {
      setP(data);
      setItems(data.prohibited_items.join(", "));
    }
  }, [data]);

  async function save() {
    setBusy(true);
    const value = {
      ...p,
      prohibited_items: items.split(",").map((s) => s.trim()).filter(Boolean),
      report_sla_hours: Math.max(1, Number(p.report_sla_hours) || 48),
      max_rental_days: Math.max(1, Number(p.max_rental_days) || 120),
    };
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "policies", value, updated_by: userId }, { onConflict: "key" });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAdminAction(userId, "settings.policies.update", JSON.stringify(value).slice(0, 300));
    qc.invalidateQueries({ queryKey: ["admin-policies"] });
    toast.success("Policies saved for every college");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-extrabold">Platform policies</h2>
        <p className="text-sm text-muted-foreground">These rules apply to every college on SwapSpace.</p>
      </div>
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="space-y-1">
          <Label>Prohibited items (comma separated)</Label>
          <Textarea value={items} onChange={(e) => setItems(e.target.value)} rows={3} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Report response time (hours)</Label>
            <Input type="number" min={1} value={p.report_sla_hours} onChange={(e) => setP({ ...p, report_sla_hours: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label>Longest rental (days)</Label>
            <Input type="number" min={1} value={p.max_rental_days} onChange={(e) => setP({ ...p, max_rental_days: Number(e.target.value) })} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Fresher handling</Label>
          <Textarea value={p.fresher_handling} onChange={(e) => setP({ ...p, fresher_handling: e.target.value })} rows={2} />
        </div>
        <div className="space-y-1">
          <Label>Deposit guidance</Label>
          <Textarea value={p.deposit_guidance} onChange={(e) => setP({ ...p, deposit_guidance: e.target.value })} rows={2} />
        </div>
        <div className="flex justify-end">
          <Button className="rounded-full" disabled={busy} onClick={save}>
            {busy ? "Saving…" : "Save policies"}
          </Button>
        </div>
      </section>
    </div>
  );
}
