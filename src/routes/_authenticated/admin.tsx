import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  Flag,
  Gavel,
  LayoutGrid,
  Megaphone,
  MessagesSquare,
  ScrollText,
  Settings,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin portal — SwapSpace" },
      { name: "description", content: "Moderate listings, students and reports across the campus marketplace." },
      { property: "og:title", content: "Admin portal — SwapSpace" },
      { property: "og:description", content: "Moderate listings, students and reports." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

export const adminNav = [
  { to: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
  { to: "/admin/colleges", label: "Colleges", icon: Building2, exact: false, superOnly: true },
  { to: "/admin/listings", label: "Listings", icon: LayoutGrid, exact: false, superOnly: false },
  { to: "/admin/categories", label: "Categories", icon: Tags, exact: false, superOnly: true },
  { to: "/admin/banners", label: "Banners", icon: Megaphone, exact: false },
  { to: "/admin/reports", label: "Reports", icon: Flag, exact: false },
  { to: "/admin/chats", label: "Chats", icon: MessagesSquare, exact: false, superOnly: true },
  { to: "/admin/students", label: "Students", icon: Users, exact: false },
  { to: "/admin/broadcast", label: "Announcements", icon: Megaphone, exact: false, superOnly: true },
  { to: "/admin/settings", label: "Settings", icon: Settings, exact: false, superOnly: true },
  { to: "/admin/policies", label: "Policies", icon: Gavel, exact: false, superOnly: true },
  { to: "/admin/logs", label: "Audit log", icon: ScrollText, exact: false },
] as const;



function AdminLayout() {
  const { isAdmin, isSuperAdmin, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (loading) {
    return (
      <AppShell title="Admin portal" nav={false}>
        <div className="py-16 text-center text-sm text-muted-foreground">Checking access…</div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Admin" nav={false}>
        <EmptyState
          title="Admins only"
          description="This area is limited to the SwapSpace moderation team."
          action={
            <Button asChild className="mt-2 rounded-full">
              <Link to="/market">Back to market</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const nav = adminNav.filter((i) => isSuperAdmin || !("superOnly" in i && i.superOnly));
  const blocked = !isSuperAdmin && adminNav.some((i) => "superOnly" in i && i.superOnly && isActive(pathname, i.to, i.exact));

  return (
    <AppShell title={isSuperAdmin ? "Super Admin portal" : "College Admin portal"} nav={false}>
      <div className="flex gap-5 pt-4">
        <aside className="sticky top-20 hidden h-fit w-52 shrink-0 rounded-2xl border border-border bg-card p-2 md:block">
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {isSuperAdmin ? "Super Admin" : "College Admin"}
          </div>
          <nav className="space-y-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive(pathname, item.to, item.exact)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <nav className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  isActive(pathname, item.to, item.exact)
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
          {blocked ? (
            <EmptyState title="Super Admin only" description="This section is managed by the SwapSpace platform team." />
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function isActive(pathname: string, to: string, exact: boolean) {
  return exact ? pathname === to : pathname.startsWith(to);
}
