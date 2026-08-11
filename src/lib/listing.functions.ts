import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Public, anon-safe listing summary used for share/SEO metadata. */
export const getListingMeta = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabasePublic = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: row } = await supabasePublic
      .from("listings")
      .select("title, description, price, type, listing_images(url, sort_order)")
      .eq("id", data.id)
      .eq("status", "approved")
      .maybeSingle();

    if (!row) return null;
    const image = [...(row.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
    return {
      title: row.title,
      description: row.description,
      price: row.price,
      type: row.type,
      image,
    };
  });
