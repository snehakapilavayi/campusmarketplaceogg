import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/admin";

export type GeneralSettings = {
  site_name: string;
  tagline: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  signups_enabled: boolean;
  allowed_email_domain: string;
};

export type LimitSettings = {
  max_photos_per_listing: number;
  max_active_listings: number;
  max_price: number;
  min_price: number;
};

export type ContentSettings = {
  hero_title: string;
  hero_subtitle: string;
  instagram_url: string;
  support_email: string;
};

export type ModerationSettings = {
  blocklist: string[];
  auto_flag: boolean;
};

export type AppSettings = {
  general: GeneralSettings;
  limits: LimitSettings;
  content: ContentSettings;
  moderation: ModerationSettings;
};

export const defaultSettings: AppSettings = {
  general: {
    site_name: "SwapSpace",
    tagline: "Campus-only buy, rent and swap for Vishnu students.",
    maintenance_mode: false,
    maintenance_message: "SwapSpace is getting a quick tune-up. Back in a few minutes.",
    signups_enabled: true,
    allowed_email_domain: "vishnu.edu.in",
  },
  limits: { max_photos_per_listing: 6, max_active_listings: 10, max_price: 100000, min_price: 0 },
  content: {
    hero_title: "Everything you need is already on campus.",
    hero_subtitle: "Buy, rent and swap with verified Vishnu students. No strangers, no commission.",
    instagram_url: "https://www.instagram.com/swapspace.in?igsh=MWZ4NHUyeHI0bTEyZA==",
    support_email: "info.swapspace@gmail.com",
  },
  moderation: { blocklist: [], auto_flag: true },
};

export const settingsQueryKey = ["app-settings"] as const;

async function fetchSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from("app_settings").select("key,value");
  if (error) throw error;
  const merged = { ...defaultSettings };
  for (const row of data ?? []) {
    const key = row.key as keyof AppSettings;
    if (key in merged) {
      merged[key] = { ...(merged[key] as object), ...((row.value ?? {}) as object) } as never;
    }
  }
  return merged;
}

/** App-wide settings, editable from the admin portal. */
export function useAppSettings() {
  const { data } = useQuery({
    queryKey: settingsQueryKey,
    queryFn: fetchSettings,
    staleTime: 60_000,
  });
  return data ?? defaultSettings;
}

export function useSaveSettings() {
  const queryClient = useQueryClient();
  return async function save<K extends keyof AppSettings>(
    adminId: string | null,
    key: K,
    value: AppSettings[K],
  ) {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value: value as never, updated_by: adminId }, { onConflict: "key" });
    if (error) throw error;
    await logAdminAction(adminId, `settings.${String(key)}.update`, JSON.stringify(value).slice(0, 300));
    await queryClient.invalidateQueries({ queryKey: settingsQueryKey });
  };
}

/** Returns the first blocked term found in the text, if any. */
export function findBlockedTerm(text: string, blocklist: string[]) {
  const haystack = text.toLowerCase();
  return blocklist.map((w) => w.trim().toLowerCase()).find((w) => w.length > 0 && haystack.includes(w)) ?? null;
}
