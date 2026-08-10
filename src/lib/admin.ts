import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ListingStatus = Database["public"]["Enums"]["listing_status"];
export type AdminListingFilter = ListingStatus | "all" | "featured";

/* ------------------------------------------------------------------ audit */

export async function logAdminAction(adminId: string | null, action: string, target?: string | null) {
  if (!adminId) return;
  await supabase.from("admin_logs").insert({ admin_id: adminId, action, target: target ?? null });
}

export async function logAdminActions(adminId: string | null, action: string, targets: string[]) {
  if (!adminId || targets.length === 0) return;
  await supabase.from("admin_logs").insert(targets.map((t) => ({ admin_id: adminId, action, target: t })));
}

/* ---------------------------------------------------------- notifications */

export type NotifyPayload = {
  userId: string;
  title: string;
  message?: string | null;
  icon?: string | null;
};

/** Sends in-app notifications to students (admin-only insert policy). */
export async function notifyUsers(items: NotifyPayload[]) {
  const rows = items.filter((i) => !!i.userId);
  if (rows.length === 0) return;
  await supabase.from("notifications").insert(
    rows.map((r) => ({
      user_id: r.userId,
      title: r.title,
      message: r.message ?? null,
      icon: r.icon ?? null,
    })),
  );
}

/* --------------------------------------------------------------- listings */

export function useAdminListings(enabled: boolean, filter: AdminListingFilter) {
  return useQuery({
    queryKey: ["admin-listings", filter],
    enabled,
    queryFn: async () => {
      let q = supabase
        .from("listings")
        .select(
          "id,title,description,price,type,status,condition,featured,created_at,seller_id,category_id,rejection_reason,resubmit_by,listing_images(url,sort_order),profiles:seller_id(full_name,verification,campus)",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter === "featured") q = q.eq("featured", true);
      else if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* ---------------------------------------------------------------- reports */

export function useAdminReports(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-reports"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* --------------------------------------------------------------- students */

export function useAdminStudents(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-students"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,verification,swapcoin_rating,transactions_count,suspended,campus,created_at,account_type")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type RiskSignals = { rejected: number; reports: number; lowRating: boolean; ratings: number };

/** Rejected-listing counts, report counts and rating counts keyed by user id. */
export function useTrustSignals(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-trust-signals"],
    enabled,
    queryFn: async () => {
      const [rejected, reports, ratings] = await Promise.all([
        supabase.from("listings").select("seller_id").eq("status", "rejected").limit(2000),
        supabase.from("reports").select("target_id,target_type").eq("target_type", "user").limit(2000),
        supabase.from("ratings").select("reviewed_id").limit(2000),
      ]);
      const map = new Map<string, RiskSignals>();
      const bump = (id: string | null, key: keyof RiskSignals) => {
        if (!id) return;
        const cur = map.get(id) ?? { rejected: 0, reports: 0, lowRating: false, ratings: 0 };
        if (key === "rejected" || key === "reports" || key === "ratings") cur[key] += 1;
        map.set(id, cur);
      };
      (rejected.data ?? []).forEach((r) => bump(r.seller_id, "rejected"));
      (reports.data ?? []).forEach((r) => bump(r.target_id, "reports"));
      (ratings.data ?? []).forEach((r) => bump(r.reviewed_id, "ratings"));
      return map;
    },
  });
}

export function riskReasons(
  student: { swapcoin_rating: number | string; id: string },
  signals: Map<string, RiskSignals> | undefined,
) {
  const s = signals?.get(student.id);
  const reasons: string[] = [];
  if (s && s.ratings > 0 && Number(student.swapcoin_rating) < 3) reasons.push("Low rating");
  if (s && s.rejected >= 3) reasons.push(`${s.rejected} rejected listings`);
  if (s && s.reports >= 2) reasons.push(`${s.reports} reports`);
  return reasons;
}

/* ------------------------------------------------------------- categories */

export function useAdminCategories(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-categories"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCategoryUsage(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-category-usage"],
    enabled,
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("category_id").limit(5000);
      const map = new Map<string, number>();
      (data ?? []).forEach((l) => {
        if (l.category_id) map.set(l.category_id, (map.get(l.category_id) ?? 0) + 1);
      });
      return map;
    },
  });
}

/* -------------------------------------------------------------- audit log */

export function useAdminLogs(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-logs"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_logs")
        .select("id,action,target,created_at,admin_id,profiles:admin_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* ----------------------------------------------------------- reported chat */

export function useReportedConversations(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-chats"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id,buyer_id,seller_id,listing_id,created_at,reported,listings:listing_id(title)")
        .eq("reported", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["admin-chat-messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id,sender_id,content,image_url,created_at")
        .eq("conversation_id", conversationId!)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* ------------------------------------------------------------------ stats */

export function useAdminStats(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-stats"],
    enabled,
    queryFn: async () => {
      const counts = async (status?: ListingStatus) => {
        let q = supabase.from("listings").select("id", { count: "exact", head: true });
        if (status) q = q.eq("status", status);
        const { count } = await q;
        return count ?? 0;
      };
      const [total, approved, pending, rejected] = await Promise.all([
        counts(),
        counts("approved"),
        counts("pending"),
        counts("rejected"),
      ]);
      const { count: students } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      const { count: verified } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("verification", "verified");
      const { count: reports } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      const { count: chats } = await supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("reported", true);
      return {
        total,
        approved,
        pending,
        rejected,
        students: students ?? 0,
        verified: verified ?? 0,
        reports: reports ?? 0,
        chats: chats ?? 0,
      };
    },
  });
}

/* -------------------------------------------------------------- analytics */

export type RangeDays = 7 | 30 | 90;

export function useAdminAnalytics(enabled: boolean, days: RangeDays) {
  return useQuery({
    queryKey: ["admin-analytics", days],
    enabled,
    queryFn: async () => {
      const since = new Date(Date.now() - (days - 1) * 86_400_000);
      since.setHours(0, 0, 0, 0);
      const iso = since.toISOString();

      const [listings, profiles, categories] = await Promise.all([
        supabase.from("listings").select("created_at,status,category_id").gte("created_at", iso).limit(5000),
        supabase.from("profiles").select("created_at,campus").gte("created_at", iso).limit(5000),
        supabase.from("categories").select("id,name"),
      ]);

      const dayKeys: string[] = [];
      for (let i = 0; i < days; i++) {
        dayKeys.push(new Date(since.getTime() + i * 86_400_000).toISOString().slice(0, 10));
      }
      const listingsByDay = new Map(dayKeys.map((d) => [d, 0]));
      const signupsByDay = new Map(dayKeys.map((d) => [d, 0]));
      const byStatus = new Map<string, number>();
      const byCategory = new Map<string, number>();

      (listings.data ?? []).forEach((l) => {
        const d = String(l.created_at).slice(0, 10);
        if (listingsByDay.has(d)) listingsByDay.set(d, (listingsByDay.get(d) ?? 0) + 1);
        byStatus.set(l.status, (byStatus.get(l.status) ?? 0) + 1);
        if (l.category_id) byCategory.set(l.category_id, (byCategory.get(l.category_id) ?? 0) + 1);
      });
      (profiles.data ?? []).forEach((p) => {
        const d = String(p.created_at).slice(0, 10);
        if (signupsByDay.has(d)) signupsByDay.set(d, (signupsByDay.get(d) ?? 0) + 1);
      });

      const catNames = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
      const label = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

      return {
        daily: dayKeys.map((d) => ({
          day: label(d),
          listings: listingsByDay.get(d) ?? 0,
          signups: signupsByDay.get(d) ?? 0,
        })),
        status: [...byStatus.entries()].map(([name, value]) => ({ name, value })),
        categories: [...byCategory.entries()]
          .map(([id, value]) => ({ name: catNames.get(id) ?? "Other", value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6),
        totalListings: listings.data?.length ?? 0,
        totalSignups: profiles.data?.length ?? 0,
      };
    },
  });
}

/* ---------------------------------------------------------------- banners */

export type BannerFilter = "all" | "live" | "scheduled" | "inactive";

export function useAdminBanners(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-banners"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_banners")
        .select("*")
        .order("starts_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type AdminBanner = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  accent: string | null;
  campus: string | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
};

export function bannerState(b: Pick<AdminBanner, "active" | "starts_at" | "ends_at">) {
  if (!b.active) return "inactive" as const;
  const today = new Date().toISOString().slice(0, 10);
  if (b.starts_at && b.starts_at > today) return "scheduled" as const;
  if (b.ends_at && b.ends_at < today) return "expired" as const;
  return "live" as const;
}

/* ----------------------------------------------------------------- misc */

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function campusOptions(rows: { campus?: string | null }[]) {
  return [...new Set(rows.map((r) => r.campus).filter((c): c is string => !!c && c.trim() !== ""))].sort();
}
