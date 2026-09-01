import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/admin";

export type GeneralSettings = {
  site_name: string;
  tagline: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  signups_enabled: boolean;
  /** Domains accepted as standard student accounts, e.g. ["edu.in"]. */
  allowed_email_domains: string[];
  /** Domains accepted for freshers signing up before their college email exists. */
  fresher_domains: string[];
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
    tagline: "Campus-only buy, rent and swap for students.",
    maintenance_mode: false,
    maintenance_message: "SwapSpace is getting a quick tune-up. Back in a few minutes.",
    signups_enabled: true,
    allowed_email_domains: ["edu.in"],
    fresher_domains: ["gmail.com"],
  },
  limits: {
    max_photos_per_listing: 6,
    max_active_listings: 10,
    max_price: 100000,
    min_price: 0,
  },
  content: {
    hero_title: "Everything you need is already on campus.",
    hero_subtitle: "Your next textbook might be sitting in your senior's room. Find it on SwapSpace -- textbooks, calculators, lab coats & more from people on your campus. Meet. Swap. Done.",
    instagram_url: "https://www.instagram.com/swapspace.in/",
    support_email: "info.swapspace@gmail.com",
  },
  moderation: { blocklist: [], auto_flag: true },
};

/** Normalises a domain list coming from settings (admins may type "@edu.in"). */
export function normalizeDomains(list: unknown, fallback: string[]) {
  const arr = Array.isArray(list)
    ? list
    : typeof list === "string"
      ? list.split(",")
      : [];
  const cleaned = arr
    .map((d) => String(d).trim().toLowerCase().replace(/^@/, "").replace(/^\./, ""))
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
}

export const ADMIN_EMAIL = "admin@swapspace.in";

/** Which signup lane an email belongs to — null means the address isn't allowed. */
export function classifyEmail(email: string, general: GeneralSettings): "edu" | "fresher" | null {
  const clean = email.trim().toLowerCase();
  if (clean === ADMIN_EMAIL) return "edu";
  const matches = (domains: string[]) =>
    domains.some((d) => clean.endsWith(`@${d}`) || clean.endsWith(`.${d}`));
  if (matches(normalizeDomains(general.allowed_email_domains, ["edu.in"]))) return "edu";
  if (matches(normalizeDomains(general.fresher_domains, ["gmail.com"]))) return "fresher";
  return null;
}


export const settingsQueryKey = ["app-settings"] as const;

async function fetchSettings(): Promise<AppSettings> {
  const [publicRes, adminRes] = await Promise.all([
    supabase.rpc("get_public_settings"),
    // Admin-only: returns rows (incl. moderation) for admins, empty otherwise.
    supabase.from("app_settings").select("key,value"),
  ]);
  if (publicRes.error) throw publicRes.error;
  const merged = { ...defaultSettings };
  const rows = [...(publicRes.data ?? []), ...(adminRes.data ?? [])];
  for (const row of rows) {
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
