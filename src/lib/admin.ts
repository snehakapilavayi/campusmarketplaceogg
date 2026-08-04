import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ListingStatus = Database["public"]["Enums"]["listing_status"];
export type AdminListingFilter = ListingStatus | "all";

export function useAdminListings(enabled: boolean, filter: AdminListingFilter) {
  return useQuery({
    queryKey: ["admin-listings", filter],
    enabled,
    queryFn: async () => {
      let q = supabase
        .from("listings")
        .select(
          "id,title,description,price,type,status,condition,created_at,seller_id,listing_images(url,sort_order),profiles:seller_id(full_name,verification)",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

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

export function useAdminStudents(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-students"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,verification,tomato_rating,transactions_count,suspended,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

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
      return {
        total,
        approved,
        pending,
        rejected,
        students: students ?? 0,
        verified: verified ?? 0,
        reports: reports ?? 0,
      };
    },
  });
}
