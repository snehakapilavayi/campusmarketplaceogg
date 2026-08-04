import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { relativeTime, useAdminLogs } from "@/lib/admin";
import { downloadCsv } from "@/lib/csv";
import { EmptyState } from "@/components/brand";
import { ExportButton } from "@/components/admin-ui";
import { ListSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  component: AdminLogs,
});

const PAGE = 25;

type LogRow = {
  id: string;
  action: string;
  target: string | null;
  created_at: string;
  admin_id: string;
  profiles?: { full_name: string } | null;
};

function AdminLogs() {
  const { isAdmin } = useAuth();
  const { data, isLoading, error } = useAdminLogs(isAdmin);
  const logs = (data ?? []) as unknown as LogRow[];

  const [admin, setAdmin] = useState("all");
  const [action, setAction] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const admins = useMemo(() => {
    const m = new Map<string, string>();
    logs.forEach((l) => m.set(l.admin_id, l.profiles?.full_name ?? "Admin"));
    return [...m.entries()];
  }, [logs]);

  const actions = useMemo(() => [...new Set(logs.map((l) => l.action))].sort(), [logs]);

  const filtered = useMemo(
    () =>
      logs.filter((l) => {
        if (admin !== "all" && l.admin_id !== admin) return false;
        if (action !== "all" && l.action !== action) return false;
        const day = l.created_at.slice(0, 10);
        if (from && day < from) return false;
        if (to && day > to) return false;
        if (q.trim() && !(l.target ?? "").toLowerCase().includes(q.trim().toLowerCase())) return false;
        return true;
      }),
    [logs, admin, action, from, to, q],
  );

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE, current * PAGE + PAGE);

  function exportCsv() {
    downloadCsv(
      "audit-log",
      ["When", "Admin", "Action", "Target"],
      filtered.map((l) => [new Date(l.created_at).toLocaleString(), l.profiles?.full_name ?? "Admin", l.action, l.target ?? ""]),
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-extrabold">Audit log</h2>

      <div className="grid gap-2 sm:grid-cols-2">
        <select
          value={admin}
          onChange={(e) => { setAdmin(e.target.value); setPage(0); }}
          className="h-9 rounded-full border border-border bg-background px-3 text-xs font-medium"
          aria-label="Filter by admin"
        >
          <option value="all">All admins</option>
          {admins.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(0); }}
          className="h-9 rounded-full border border-border bg-background px-3 text-xs font-medium"
          aria-label="Filter by action"
        >
          <option value="all">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} className="h-9 rounded-full" aria-label="From date" />
        <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} className="h-9 rounded-full" aria-label="To date" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0); }}
          placeholder="Search target"
          className="h-9 min-w-40 flex-1 rounded-full"
        />
        <ExportButton onExport={exportCsv} disabled={filtered.length === 0} />
      </div>

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : rows.length === 0 ? (
        <EmptyState variant="idea" title="Nothing logged yet" description="Moderation actions will show up here as they happen." />
      ) : (
        <>
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {rows.map((l) => (
              <div key={l.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:gap-3">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary sm:shrink-0">
                  {l.action}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{l.target ?? "—"}</span>
                <span className="text-[11px] font-medium">{l.profiles?.full_name ?? "Admin"}</span>
                <span className="text-[11px] text-muted-foreground sm:w-20 sm:text-right">{relativeTime(l.created_at)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Page {current + 1} of {pages} · {filtered.length} entries
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 rounded-full" disabled={current === 0} onClick={() => setPage(current - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="outline" className="h-8 rounded-full" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
