import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useWishlist() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const { data: ids = [] } = useQuery({
    queryKey: ["wishlist-ids", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("wishlist").select("listing_id").eq("user_id", userId!);
      return (data ?? []).map((r) => r.listing_id);
    },
  });

  const toggle = useMutation({
    mutationFn: async (listingId: string) => {
      if (!userId) throw new Error("Sign in to save items");
      if (ids.includes(listingId)) {
        await supabase.from("wishlist").delete().eq("user_id", userId).eq("listing_id", listingId);
        return "removed" as const;
      }
      const { error } = await supabase.from("wishlist").insert({ user_id: userId, listing_id: listingId });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-ids"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(result === "added" ? "Saved to wishlist" : "Removed from wishlist");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ids, toggle: (id: string) => toggle.mutate(id) };
}

export function useCart() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const { data: ids = [] } = useQuery({
    queryKey: ["cart-ids", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("cart").select("listing_id").eq("user_id", userId!);
      return (data ?? []).map((r) => r.listing_id);
    },
  });

  const toggle = useMutation({
    mutationFn: async (listingId: string) => {
      if (!userId) throw new Error("Sign in to use your cart");
      if (ids.includes(listingId)) {
        await supabase.from("cart").delete().eq("user_id", userId).eq("listing_id", listingId);
        return "removed" as const;
      }
      const { error } = await supabase.from("cart").insert({ user_id: userId, listing_id: listingId });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["cart-ids"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(result === "added" ? "Added to cart" : "Removed from cart");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ids, toggle: (id: string) => toggle.mutate(id) };
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
