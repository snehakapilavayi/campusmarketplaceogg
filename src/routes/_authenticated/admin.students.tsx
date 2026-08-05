import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deleteStudentAccounts } from "@/lib/account.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
import { campusOptions, logAdminActions, riskReasons, useAdminStudents, useTrustSignals } from "@/lib/admin";
import { downloadCsv } from "@/lib/csv";
import type { Database } from "@/integrations/supabase/types";
import { EmptyState } from "@/components/brand";
import { BulkBar, CampusSelect, ExportButton, FilterTabs, RiskBadge, SelectAllRow } from "@/components/admin-ui";
import { ListSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/students")({
  component: AdminStudents,
});

type Tab = "all" | "pending" | "verified" | "suspended" | "flagged";
const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Unverified" },
  { value: "verified", label: "Verified" },
  { value: "suspended", label: "Suspended" },
  { value: "flagged", label: "Flagged" },
];

function AdminStudents() {
  const { isAdmin, userId } = useAuth();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [campus, setCampus] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const { data: students = [], isLoading, error } = useAdminStudents(isAdmin);
  const { data: signals } = useTrustSignals(isAdmin);
  const deleteStudents = useServerFn(deleteStudentAccounts);

  const campuses = useMemo(() => campusOptions(students), [students]);

  const visible = useMemo(
    () =>
      students.filter((s) => {
        if (!s.full_name.toLowerCase().includes(q.trim().toLowerCase())) return false;
        if (campus === "__none" ? !!s.campus : campus !== "all" && s.campus !== campus) return false;
        if (tab === "pending") return s.verification === "pending";
        if (tab === "verified") return s.verification === "verified";
        if (tab === "suspended") return s.suspended;
        if (tab === "flagged") return riskReasons(s, signals).length > 0;
        return true;
      }),
    [students, q, tab, campus, signals],
  );

  async function patch(
    ids: string[],
    values: Database["public"]["Tables"]["profiles"]["Update"],
    action: string,
    message: string,
  ) {
    const { error: err } = await supabase.from("profiles").update(values).in("id", ids);
    if (err) {
      toast.error(err.message);
      return;
    }
    await logAdminActions(userId, action, ids);
    queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
    setSelected([]);
    toast.success(message);
  }

  async function removeStudents(ids: string[]) {
    try {
      await logAdminActions(userId, "student.deleted", ids);
      await deleteStudents({ data: { ids } });
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
      setSelected([]);
      toast.success(ids.length > 1 ? `${ids.length} accounts deleted` : "Account deleted");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function exportCsv() {
    downloadCsv(
      "students",
      ["Name", "Campus", "Verification", "Suspended", "Rating", "Swaps", "Risk", "Joined"],
      visible.map((s) => [
        s.full_name,
        s.campus ?? "",
        s.verification,
        s.suspended ? "yes" : "no",
        Number(s.tomato_rating).toFixed(1),
        s.transactions_count,
        riskReasons(s, signals).join(" | "),
        new Date(s.created_at).toLocaleDateString(),
      ]),
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-extrabold">Students</h2>

      <FilterTabs value={tab} onChange={(v) => { setTab(v); setSelected([]); }} options={TABS} />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search students"
          className="h-9 min-w-40 flex-1 rounded-full"
        />
        <CampusSelect value={campus} onChange={setCampus} options={campuses} />
        <ExportButton onExport={exportCsv} disabled={visible.length === 0} />
      </div>

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          variant="happy"
          title={tab === "flagged" ? "No one needs attention" : "No students found"}
          description={
            tab === "flagged"
              ? "Nobody is showing low ratings, repeated rejections or multiple reports."
              : "Try another search, tab or campus."
          }
        />
      ) : (
        <>
          <SelectAllRow
            count={visible.length}
            selected={selected.length}
            onToggleAll={(c) => setSelected(c ? visible.map((s) => s.id) : [])}
          />
          {visible.map((s) => {
            const reasons = riskReasons(s, signals);
            const checked = selected.includes(s.id);
            return (
              <div
                key={s.id}
                className={cn("rounded-2xl border bg-card p-3", checked ? "border-primary/50" : "border-border")}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) =>
                      setSelected((prev) => (c ? [...prev, s.id] : prev.filter((id) => id !== s.id)))
                    }
                    aria-label={`Select ${s.full_name}`}
                  />
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent font-display font-bold">
                    {s.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold">
                      <span className="truncate">{s.full_name}</span>
                      {s.verification === "verified" && (
                        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                          verified
                        </span>
                      )}
                      {s.suspended && (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                          suspended
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span
                        className={cn(
                          "font-semibold",
                          s.verification === "verified" && "text-success",
                          s.verification === "rejected" && "text-destructive",
                        )}
                      >
                        {s.verification}
                      </span>{" "}
                      · 🍅 {Number(s.tomato_rating).toFixed(1)} · {s.transactions_count} swaps
                      {s.campus ? ` · ${s.campus}` : ""}
                    </p>
                    {reasons.length > 0 && (
                      <div className="mt-1">
                        <RiskBadge reasons={reasons} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {s.verification !== "verified" && (
                    <Button
                      size="sm"
                      className="h-8 rounded-full"
                      onClick={() => void patch([s.id], { verification: "verified" }, "student.verified", "Student verified")}
                    >
                      Verify
                    </Button>
                  )}
                  {s.verification !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-full"
                      onClick={() => void patch([s.id], { verification: "rejected" }, "student.rejected", "Verification rejected")}
                    >
                      Reject
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-full"
                    onClick={() =>
                      void patch(
                        [s.id],
                        { suspended: !s.suspended },
                        s.suspended ? "student.unsuspended" : "student.suspended",
                        s.suspended ? "Account restored" : "Account suspended",
                      )
                    }
                  >
                    {s.suspended ? "Unsuspend" : "Suspend"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 rounded-full text-destructive hover:text-destructive">
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {s.full_name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes the account, their listings, chats and saved items. This cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="rounded-full" onClick={() => void removeStudents([s.id])}>
                          Delete account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </>
      )}

      <BulkBar
        count={selected.length}
        onClear={() => setSelected([])}
        actions={[
          { label: "Verify", run: async () => { await patch(selected, { verification: "verified" }, "student.verified", "Students verified"); } },
          { label: "Reject", run: async () => { await patch(selected, { verification: "rejected" }, "student.rejected", "Verification rejected"); } },
          {
            label: "Suspend",
            destructive: true,
            description: "Suspended students cannot list or chat until restored.",
            run: async () => { await patch(selected, { suspended: true }, "student.suspended", "Accounts suspended"); },
          },
          {
            label: "Delete",
            destructive: true,
            description: "Permanently removes these accounts, their listings, chats and saved items.",
            run: async () => { await removeStudents(selected); },
          },
        ]}
      />
    </div>
  );
}
