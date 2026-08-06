import { useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { Bell, Bike, Heart, Home, LayoutGrid, MessageCircle, Plus, Search, ShoppingBag, User } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/lib/theme";
import { PageTransition, springy } from "@/lib/motion";
import { CommandPalette } from "@/components/command-palette";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader({ title, actions = true }: { title?: string | undefined; actions?: boolean }) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const { data: savedCount = 0 } = useQuery({
    queryKey: ["wishlist-count", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count } = await supabase
        .from("wishlist")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId!);
      return count ?? 0;
    },
  });


  // Live notification badge + clickable toast.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as { title: string; message: string | null };
          queryClient.invalidateQueries({ queryKey: ["unread-notifications", userId] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          toast(row.title, {
            description: row.message ?? undefined,
            action: { label: "View", onClick: () => navigate({ to: "/notifications" }) },
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, navigate]);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-3 sm:px-4">
        {title ? (
          <h1 className="min-w-0 truncate font-display text-lg font-bold">{title}</h1>
        ) : (
          <Logo />
        )}
        <div className="flex shrink-0 items-center gap-0.5">
          {actions && (
            <Link
              to="/wishlist"
              className="relative grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Wishlist${savedCount > 0 ? ` (${savedCount} saved)` : ""}`}
            >
              <Heart className="h-5 w-5" />
              {savedCount > 0 && (
                <motion.span
                  key={savedCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={springy}
                  className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground ring-2 ring-background"
                >
                  {savedCount > 9 ? "9+" : savedCount}
                </motion.span>
              )}
            </Link>
          )}
          <ThemeToggle />
          {actions && (
            <>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
                className="hidden h-11 w-11 place-items-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid"
                aria-label="Search (Command K)"
              >
                <Search className="h-5 w-5" />
              </button>
              <Link
                to="/notifications"
                className="relative grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <motion.span
                    key={unread}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={springy}
                    className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background"
                  />
                )}
              </Link>
              <Link
                to="/chat"
                className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Messages"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const navItems = [
  { to: "/profile", label: "Account", icon: User },
  { to: "/categories", label: "Categories", icon: LayoutGrid },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/", label: "Home", icon: Home },

] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduce = useReducedMotion();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-5xl grid-cols-5 items-end px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] sm:px-2">
        {navItems.slice(0, 2).map((item) => (
          <NavLink key={item.to} {...item} active={pathname === item.to} />
        ))}
        <div className="flex min-w-0 justify-center">
          <motion.div whileTap={reduce ? undefined : { scale: 0.9 }} transition={springy}>
            <Link
              to="/sell"
              aria-label="Add item"
              className="-mt-6 grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-amber)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </Link>
          </motion.div>
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
  const reduce = useReducedMotion();
  return (
    <motion.div whileTap={reduce ? undefined : { scale: 0.94 }} transition={springy} className="min-w-0">
      <Link
        to={to}
        preload="intent"
        className={cn(
          "relative flex min-h-11 min-w-0 flex-col items-center gap-1 px-0.5 py-2.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[11px]",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {active && (
          <motion.span
            layoutId="nav-pill"
            transition={reduce ? { duration: 0 } : springy}
            className="absolute inset-x-2 top-1 -z-10 h-8 rounded-full bg-accent"
            aria-hidden
          />
        )}
        <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} strokeWidth={active ? 2.4 : 2} />
        <span className="w-full truncate text-center leading-tight">{label}</span>
      </Link>
    </motion.div>
  );
}

export function AppShell({
  children,
  title,
  header = true,
  nav = true,
}: {
  children: React.ReactNode;
  title?: string | undefined;
  header?: boolean;
  nav?: boolean;
}) {
  const { general } = useAppSettings();

  return (
    <div className={cn("relative min-h-screen bg-background", nav ? "pb-24" : "pb-10")}>
      <div
        className="brand-pattern-subtle pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        aria-hidden
      />
      <div className="relative">
        {general.maintenance_mode && (
          <div className="bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground">
            {general.maintenance_message}
          </div>
        )}
        {header && <AppHeader title={title} actions={nav} />}
        <main className="mx-auto max-w-5xl px-3 sm:px-4">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {nav && <BottomNav />}
      <CommandPalette />
    </div>
  );
}
