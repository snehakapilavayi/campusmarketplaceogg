import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, LogOut, Package, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { CoinRating, currency, DealClosedBadge, EmptyState, VerifiedBadge } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your account — SwapSpace" },
      { name: "description", content: "Your student profile, SwapCoins rating and swap history on SwapSpace." },
      { property: "og:title", content: "Your account — SwapSpace" },
      { property: "og:description", content: "Your student profile and swap history." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, userId, isAdmin, signOut } = useAuth();



  const { data: stats } = useQuery({
    queryKey: ["profile-stats", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ count: active }, { count: sold }] = await Promise.all([
        supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", userId!)
          .eq("status", "approved"),
        supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", userId!)
          .eq("status", "completed"),
      ]);
      return { active: active ?? 0, sold: sold ?? 0 };
    },
  });

  return (
    <AppShell title="Account">
      <div className="space-y-5 pt-4">
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-soft)]">
          <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-accent font-display text-2xl font-extrabold">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              (profile?.full_name ?? "S").charAt(0)
            )}
          </div>
          <h1 className="mt-3 font-display text-xl font-extrabold">{profile?.full_name ?? "Student"}</h1>
          <div className="mt-2 flex justify-center">
            <VerifiedBadge />
          </div>
          {profile?.bio && <p className="mt-1 text-sm text-muted-foreground">{profile.bio}</p>}

          <div className="mt-3 flex items-center justify-center gap-2">
            <CoinRating value={profile?.swapcoin_rating ?? 0} />
            {profile?.verification === "verified" && <VerifiedBadge compact />}
          </div>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            SwapCoins trust score
          </p>
          <div className="mt-5 grid grid-cols-3 divide-x divide-border border-t border-border pt-4 text-center">
            <Stat label="Active" value={stats?.active ?? 0} />
            <Stat label="Completed" value={stats?.sold ?? 0} />
            <Stat label="Swaps" value={profile?.transactions_count ?? 0} />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <Row to="/my-listings" icon={Package} label="My listings" />
          <Row to="/settings" icon={SettingsIcon} label="Settings" />
          {isAdmin && <Row to="/admin" icon={ShieldCheck} label="Admin portal" />}
        </div>

        <PurchasesSection userId={userId} />


        <Button variant="outline" className="w-full rounded-full" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>



      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-lg font-extrabold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({ to, icon: Icon, label }: { to: string; icon: typeof Package; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 border-b border-border p-4 last:border-0 hover:bg-muted/60">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

/** Closed deals where this student was the buyer. */
function PurchasesSection({ userId }: { userId: string | null }) {
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["purchases", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("id,title,price,sold_at,profiles!listings_seller_id_fkey(full_name)")
        .eq("buyer_id", userId!)
        .order("sold_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <h2 className="font-display text-base font-bold">Purchases</h2>
      <p className="mb-4 mt-1 text-xs text-muted-foreground">Deals you closed on campus.</p>
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <EmptyState
          title="No deals yet"
          description="Once you close a swap, it shows up here with the seller and date."
        />
      ) : (
        <ul className="space-y-2">
          {purchases.map((p) => (
            <li key={p.id}>
              <Link
                to="/listing/$id"
                params={{ id: p.id }}
                className="flex items-center gap-3 rounded-2xl border border-border p-3 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    From {p.profiles?.full_name ?? "a student"}
                    {p.sold_at && ` · ${new Date(p.sold_at).toLocaleDateString()}`}
                  </p>
                </div>
                <span className="shrink-0 font-display text-sm font-bold text-primary">{currency(p.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export { DealClosedBadge };

