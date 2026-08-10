import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Campus = {
  id: string;
  name: string;
  active: boolean;
  sort_order: number;
};

/** Active campuses students can pick from. */
export function useCampuses(includeInactive = false) {
  return useQuery({
    queryKey: ["campuses", includeInactive],
    queryFn: async () => {
      let q = supabase.from("campuses").select("id,name,active,sort_order").order("sort_order");
      if (!includeInactive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Campus[];
    },
    staleTime: 5 * 60_000,
  });
}

/** Falls back to the only active campus when a profile has none set. */
export function displayCampus(campus: string | null | undefined, campuses: Campus[]) {
  if (campus?.trim()) return campus;
  return campuses[0]?.name ?? "Campus";
}
