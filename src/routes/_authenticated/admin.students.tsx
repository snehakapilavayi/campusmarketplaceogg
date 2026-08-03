import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAdminStudents } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/students")({
  component: AdminStudents,
});

function AdminStudents() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const { data: students = [], isLoading } = useAdminStudents(isAdmin);

  const filtered = students.filter((s) => s.full_name.toLowerCase().includes(q.trim().toLowerCase()));

  async function verify(id: string) {
    const { error } = await supabase.from("profiles").update({ verification: "verified" }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    toast.success("Student verified");
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-extrabold">Students</h2>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search students"
        className="rounded-full"
      />
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {filtered.map((s) => (
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
    </div>
  );
}
