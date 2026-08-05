import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, Clock, Flag, MessageSquareWarning, ShieldAlert, ShieldCheck, Users, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  riskReasons,
  useAdminAnalytics,
  useAdminStats,
  useAdminStudents,
  useTrustSignals,
  type RangeDays,
} from "@/lib/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

const RANGES: RangeDays[] = [7, 30, 90];
const PIE_COLORS = ["var(--color-primary)", "#10b981", "#f97316", "#94a3b8", "#ef4444", "#6366f1"];

function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [days, setDays] = useState<RangeDays>(30);
  const { data: stats, isLoading } = useAdminStats(isAdmin);
  const { data: analytics } = useAdminAnalytics(isAdmin, days);
  const { data: students = [] } = useAdminStudents(isAdmin);
  const { data: signals } = useTrustSignals(isAdmin);

  const flagged = students.filter((s) => riskReasons(s, signals).length > 0).length;

  const campusRows = Object.entries(
    students.reduce<Record<string, number>>((acc, s) => {
      const key = s.campus?.trim() || "Vishnu (VITB)";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const cards = [
    { label: "Pending review", value: stats?.pending, icon: Clock, to: "/admin/listings", tone: "text-primary" },
    { label: "Approved listings", value: stats?.approved, icon: CheckCircle2, to: "/admin/listings", tone: "text-emerald-500" },
    { label: "Rejected", value: stats?.rejected, icon: XCircle, to: "/admin/listings", tone: "text-destructive" },
    { label: "Open reports", value: stats?.reports, icon: Flag, to: "/admin/reports", tone: "text-orange-500" },
    { label: "Reported chats", value: stats?.chats, icon: MessageSquareWarning, to: "/admin/chats", tone: "text-orange-500" },
    { label: "Students", value: stats?.students, icon: Users, to: "/admin/students", tone: "text-foreground" },
    { label: "Verified students", value: stats?.verified, icon: ShieldCheck, to: "/admin/students", tone: "text-emerald-500" },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-extrabold">Overview</h2>
          <p className="text-sm text-muted-foreground">Everything happening on SwapSpace right now.</p>
        </div>
        <div className="flex gap-1 rounded-full border border-border p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                days === r ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
          >
            <c.icon className={`h-5 w-5 ${c.tone}`} />
            <p className="mt-2 font-display text-2xl font-extrabold">{isLoading ? "—" : (c.value ?? 0)}</p>
            <p className="text-[11px] text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      {flagged > 0 && (
        <Link
          to="/admin/students"
          className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 transition-colors hover:border-destructive/60"
        >
          <ShieldAlert className="h-5 w-5 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-destructive">Needs attention</p>
            <p className="text-xs text-muted-foreground">
              {flagged} student{flagged > 1 ? "s" : ""} with low ratings, repeated rejections or multiple reports.
            </p>
          </div>
        </Link>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title={`New listings & sign-ups · last ${days} days`}>
          {analytics && analytics.totalListings + analytics.totalSignups === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics?.daily ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" stroke="var(--color-muted-foreground)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="listings" stroke="var(--color-primary)" strokeWidth={2} dot={false} name="Listings" />
                <Line type="monotone" dataKey="signups" stroke="#10b981" strokeWidth={2} dot={false} name="Sign-ups" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Listings by status">
          {!analytics || analytics.status.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={analytics.status} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {analytics.status.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Top categories">
          {!analytics || analytics.categories.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.categories} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Students by campus">
          {campusRows.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-2">
              {campusRows.slice(0, 8).map(([name, count]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-xs">{name}</span>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(count / (campusRows[0]?.[1] ?? 1)) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
} as const;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="py-12 text-center text-xs text-muted-foreground">No data in this range yet.</p>;
}
