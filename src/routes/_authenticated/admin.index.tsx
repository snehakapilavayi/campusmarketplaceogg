import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Flag, ShieldCheck, Users, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAdminStats } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { isAdmin } = useAuth();
  const { data: stats, isLoading } = useAdminStats(isAdmin);

  const cards = [
    { label: "Pending review", value: stats?.pending, icon: Clock, to: "/admin/listings", tone: "text-primary" },
    { label: "Approved listings", value: stats?.approved, icon: CheckCircle2, to: "/admin/listings", tone: "text-emerald-500" },
    { label: "Rejected", value: stats?.rejected, icon: XCircle, to: "/admin/listings", tone: "text-destructive" },
    { label: "Open reports", value: stats?.reports, icon: Flag, to: "/admin/reports", tone: "text-orange-500" },
    { label: "Students", value: stats?.students, icon: Users, to: "/admin/students", tone: "text-foreground" },
    { label: "Verified students", value: stats?.verified, icon: ShieldCheck, to: "/admin/students", tone: "text-emerald-500" },
  ] as const;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-extrabold">Overview</h2>
        <p className="text-sm text-muted-foreground">Everything happening on SwapSpace right now.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
          >
            <c.icon className={`h-5 w-5 ${c.tone}`} />
            <p className="mt-2 font-display text-2xl font-extrabold">
              {isLoading ? "—" : (c.value ?? 0)}
            </p>
            <p className="text-[11px] text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Total listings</p>
        <p className="font-display text-3xl font-extrabold">{isLoading ? "—" : (stats?.total ?? 0)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {stats ? `${stats.approved} live · ${stats.pending} waiting · ${stats.rejected} rejected` : ""}
        </p>
      </div>
    </div>
  );
}
