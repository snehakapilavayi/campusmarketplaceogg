import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAdminStudents } from "@/lib/admin";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/students")({
  component: AdminStudents,
});

function AdminStudents() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const { data: students = [], isLoading, error } = useAdminStudents(isAdmin);

  const filtered = students.filter((s) => s.full_name.toLowerCase().includes(q.trim().toLowerCase()));

  async function patch(id: string, values: Database["public"]["Tables"]["profiles"]["Update"], message: string) {
    const { error: err } = await supabase.from("profiles").update(values).eq("id", id);
    if (err) {
      toast.error(err.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    toast.success(message);
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
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {filtered.map((s) => (
        <div key={s.id} className="rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent font-display font-bold">
              {s.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {s.full_name}
                {s.suspended && (
                  <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                    suspended
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {s.verification} · 🍅 {Number(s.tomato_rating).toFixed(1)} · {s.transactions_count} swaps
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {s.verification !== "verified" && (
              <Button
                size="sm"
                className="h-8 rounded-full"
                onClick={() => patch(s.id, { verification: "verified" }, "Student verified")}
              >
                Verify
              </Button>
            )}
            {s.verification !== "rejected" && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-full"
                onClick={() => patch(s.id, { verification: "rejected" }, "Verification rejected")}
              >
                Reject
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-full"
              onClick={() =>
                patch(s.id, { suspended: !s.suspended }, s.suspended ? "Account restored" : "Account suspended")
              }
            >
              {s.suspended ? "Unsuspend" : "Suspend"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
