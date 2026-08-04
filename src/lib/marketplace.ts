import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { haptic } from "@/lib/motion";

function useToggleList(table: "wishlist" | "cart", label: { added: string; removed: string }) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const idsKey = [`${table}-ids`, userId];

  const { data: ids = [] } = useQuery({
    queryKey: idsKey,
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from(table).select("listing_id").eq("user_id", userId!);
      return (data ?? []).map((r) => r.listing_id);
    },
  });

  const toggle = useMutation({
    mutationFn: async (listingId: string) => {
      if (!userId) throw new Error(table === "cart" ? "Sign in to use your cart" : "Sign in to save items");
      if (ids.includes(listingId)) {
        const { error } = await supabase.from(table).delete().eq("user_id", userId).eq("listing_id", listingId);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await supabase.from(table).insert({ user_id: userId, listing_id: listingId });
      if (error) throw error;
      return "added" as const;
    },
    // Optimistic: flip instantly, roll back if the server rejects it.
    onMutate: async (listingId: string) => {
      haptic();
      await queryClient.cancelQueries({ queryKey: idsKey });
      const previous = queryClient.getQueryData<string[]>(idsKey) ?? [];
      const next = previous.includes(listingId)
        ? previous.filter((x) => x !== listingId)
        : [...previous, listingId];
      queryClient.setQueryData(idsKey, next);
      return { previous, added: !previous.includes(listingId) };
    },
    onError: (e: Error, _id, ctx) => {
      if (ctx) queryClient.setQueryData(idsKey, ctx.previous);
      toast.error(e.message);
    },
    onSuccess: (_result, _id, ctx) => {
      toast.success(ctx?.added ? label.added : label.removed);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: idsKey });
      queryClient.invalidateQueries({ queryKey: [table] });
    },
  });

  return { ids, toggle: (id: string) => toggle.mutate(id) };
}

export function useWishlist() {
  return useToggleList("wishlist", { added: "Saved to wishlist", removed: "Removed from wishlist" });
}

export function useCart() {
  return useToggleList("cart", { added: "Added to cart", removed: "Removed from cart" });
}

export async function openConversation(listingId: string, sellerId: string, buyerId: string) {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", buyerId)
    .eq("seller_id", sellerId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("conversations")
    .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
