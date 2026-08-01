import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Bike, Heart, LayoutGrid, MessageCircle, Plus, ShoppingBag, User } from "lucide-react";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader({ title }: { title?: string | undefined }) {
  const { userId } = useAuth();
  const { data: unread = 0 } = useQuery({
    queryKey: ["unread-notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId!)
        .eq("read", false);
      return count ?? 0;
    },
  });

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {title ? <h1 className="font-display text-lg font-bold">{title}</h1> : <Logo />}
        <div className="flex items-center gap-1">
          <Link
            to="/notifications"
            className="relative grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            )}
          </Link>
          <Link
            to="/chat"
            className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-muted"
            aria-label="Messages"
          >
            <MessageCircle className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

const navItems = [
  { to: "/profile", label: "Account", icon: User },
  { to: "/categories", label: "Categories", icon: LayoutGrid },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-5xl grid-cols-5 items-end px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.slice(0, 2).map((item) => (
          <NavLink key={item.to} {...item} active={pathname === item.to} />
        ))}
        <div className="flex justify-center">
          <Link
            to="/sell"
            aria-label="Add item"
            className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-amber)] transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </Link>
        </div>
        {navItems.slice(2).map((item) => (
          <NavLink key={item.to} {...item} active={pathname === item.to} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Bike;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5", active && "text-primary")} strokeWidth={active ? 2.4 : 2} />
      {label}
    </Link>
  );
}

export function AppShell({
  children,
  title,
  header = true,
}: {
  children: React.ReactNode;
  title?: string | undefined;
  header?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background pb-24">
      {header && <AppHeader title={title} />}
      <main className="mx-auto max-w-5xl px-4">{children}</main>
      <BottomNav />
    </div>
  );
}
