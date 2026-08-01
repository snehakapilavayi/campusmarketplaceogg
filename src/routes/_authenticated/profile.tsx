import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, LogOut, Package, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { TomatoRating, VerifiedBadge } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your account — SwapSpace" },
      { name: "description", content: "Your student profile, tomato rating and swap history on SwapSpace." },
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
          {profile?.bio && <p className="mt-1 text-sm text-muted-foreground">{profile.bio}</p>}
          <div className="mt-3 flex items-center justify-center gap-2">
            <TomatoRating value={profile?.tomato_rating ?? 0} />
            {profile?.verification === "verified" && <VerifiedBadge compact />}
          </div>
          <div className="mt-5 grid grid-cols-3 divide-x divide-border border-t border-border pt-4 text-center">
            <Stat label="Active" value={stats?.active ?? 0} />
            <Stat label="Completed" value={stats?.sold ?? 0} />
            <Stat label="Swaps" value={profile?.transactions_count ?? 0} />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <Row to="/my-listings" icon={Package} label="My listings" />
          <Row to="/onboarding" icon={ShieldCheck} label="Edit profile" />
          {isAdmin && <Row to="/admin" icon={ShieldCheck} label="Admin portal" />}
        </div>

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
