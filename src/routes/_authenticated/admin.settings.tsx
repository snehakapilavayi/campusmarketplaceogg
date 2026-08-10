import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Building2, Plus, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  useAppSettings,
  useSaveSettings,
  type ContentSettings,
  type GeneralSettings,
  type LimitSettings,
  type ModerationSettings,
} from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCampuses } from "@/lib/campuses";
import { logAdminAction } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Global settings — SwapSpace admin" },
      { name: "description", content: "Site-wide SwapSpace controls: limits, content, signups and moderation." },
      { property: "og:title", content: "Global settings — SwapSpace admin" },
      { property: "og:description", content: "Site-wide SwapSpace controls." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const { userId } = useAuth();
  const settings = useAppSettings();
  const save = useSaveSettings();

  const [general, setGeneral] = useState<GeneralSettings>(settings.general);
  const [limits, setLimits] = useState<LimitSettings>(settings.limits);
  const [content, setContent] = useState<ContentSettings>(settings.content);
  const [moderation, setModeration] = useState<ModerationSettings>(settings.moderation);
  const [blocklistText, setBlocklistText] = useState(settings.moderation.blocklist.join(", "));
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    setGeneral(settings.general);
    setLimits(settings.limits);
    setContent(settings.content);
    setModeration(settings.moderation);
    setBlocklistText(settings.moderation.blocklist.join(", "));
  }, [settings]);

  async function persist<K extends "general" | "limits" | "content" | "moderation">(
    key: K,
    value: GeneralSettings | LimitSettings | ContentSettings | ModerationSettings,
  ) {
    setSaving(key);
    try {
      await save(userId, key as never, value as never);
      toast.success("Settings saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-xl font-extrabold">Global settings</h1>
        <p className="text-sm text-muted-foreground">
          These apply across SwapSpace instantly. Every change is written to the audit log.
        </p>
      </header>

      <Card
        title="General"
        saving={saving === "general"}
        onSave={() => void persist("general", general)}
      >
        <Field label="Site name">
          <Input value={general.site_name} onChange={(e) => setGeneral({ ...general, site_name: e.target.value })} />
        </Field>
        <Field label="Tagline">
          <Input value={general.tagline} onChange={(e) => setGeneral({ ...general, tagline: e.target.value })} />
        </Field>
        <Field label="Allowed college email domains (comma separated)">
          <Input
            value={general.allowed_email_domains.join(", ")}
            onChange={(e) =>
              setGeneral({
                ...general,
                allowed_email_domains: e.target.value.split(",").map((d) => d.trim().replace(/^@/, "")).filter(Boolean),
              })
            }
            placeholder="edu.in"
          />
        </Field>
        <Field label="Fresher domains (instant access)">
          <Input
            value={general.fresher_domains.join(", ")}
            onChange={(e) =>
              setGeneral({
                ...general,
                fresher_domains: e.target.value.split(",").map((d) => d.trim().replace(/^@/, "")).filter(Boolean),
              })
            }
            placeholder="gmail.com"
          />
        </Field>

        <Toggle
          label="Signups open"
          hint="Turn off to stop new student registrations."
          checked={general.signups_enabled}
          onChange={(v) => setGeneral({ ...general, signups_enabled: v })}
        />
        <Toggle
          label="Maintenance mode"
          hint="Shows a site-wide banner to every student."
          checked={general.maintenance_mode}
          onChange={(v) => setGeneral({ ...general, maintenance_mode: v })}
        />
        <Field label="Maintenance message">
          <Textarea
            rows={2}
            value={general.maintenance_message}
            onChange={(e) => setGeneral({ ...general, maintenance_message: e.target.value })}
          />
        </Field>
      </Card>

      <Card title="Limits" saving={saving === "limits"} onSave={() => void persist("limits", limits)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Max photos per listing">
            <Input
              type="number"
              min={1}
              max={12}
              value={limits.max_photos_per_listing}
              onChange={(e) => setLimits({ ...limits, max_photos_per_listing: Number(e.target.value) })}
            />
          </Field>
          <Field label="Max active listings per student">
            <Input
              type="number"
              min={1}
              value={limits.max_active_listings}
              onChange={(e) => setLimits({ ...limits, max_active_listings: Number(e.target.value) })}
            />
          </Field>
          <Field label="Minimum price (₹)">
            <Input
              type="number"
              min={0}
              value={limits.min_price}
              onChange={(e) => setLimits({ ...limits, min_price: Number(e.target.value) })}
            />
          </Field>
          <Field label="Maximum price (₹)">
            <Input
              type="number"
              min={1}
              value={limits.max_price}
              onChange={(e) => setLimits({ ...limits, max_price: Number(e.target.value) })}
            />
          </Field>
        </div>

      </Card>

      <Card title="Homepage & footer content" saving={saving === "content"} onSave={() => void persist("content", content)}>
        <Field label="Hero title">
          <Input value={content.hero_title} onChange={(e) => setContent({ ...content, hero_title: e.target.value })} />
        </Field>
        <Field label="Hero subtitle">
          <Textarea
            rows={2}
            value={content.hero_subtitle}
            onChange={(e) => setContent({ ...content, hero_subtitle: e.target.value })}
          />
        </Field>
        <Field label="Instagram URL">
          <Input
            value={content.instagram_url}
            onChange={(e) => setContent({ ...content, instagram_url: e.target.value })}
          />
        </Field>
        <Field label="Support email">
          <Input
            value={content.support_email}
            onChange={(e) => setContent({ ...content, support_email: e.target.value })}
          />
        </Field>
      </Card>

      <CampusesCard adminId={userId} />

      <Card
        title="Moderation"
        saving={saving === "moderation"}
        onSave={() =>
          void persist("moderation", {
            ...moderation,
            blocklist: blocklistText
              .split(",")
              .map((w) => w.trim())
              .filter(Boolean),
          })
        }
      >
        <Toggle
          label="Auto-flag blocked words"
          hint="Blocks listings containing a banned term before they reach the queue."
          checked={moderation.auto_flag}
          onChange={(v) => setModeration({ ...moderation, auto_flag: v })}
        />
        <Field label="Blocked words / phrases (comma separated)">
          <Textarea
            rows={3}
            value={blocklistText}
            onChange={(e) => setBlocklistText(e.target.value)}
            placeholder="alcohol, exam paper, weapon"
          />
        </Field>
      </Card>
    </div>
  );
}

function Card({
  title,
  saving,
  onSave,
  children,
}: {
  title: string;
  saving: boolean;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold">{title}</h2>
        <Button size="sm" className="rounded-full" disabled={saving} onClick={onSave}>
          <Save className="mr-1.5 h-4 w-4" /> {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function CampusesCard({ adminId }: { adminId: string | null }) {
  const { data: campuses = [], refetch } = useCampuses(true);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: string, target: string, fn: () => Promise<{ error: unknown }>) {
    setBusy(true);
    try {
      const { error } = await fn();
      if (error) throw new Error((error as { message: string }).message);
      await logAdminAction(adminId, action, target);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["campuses"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const a = campuses[index];
    const b = campuses[index + dir];
    if (!a || !b) return;
    await run("campus.reordered", a.name, async () => {
      const r1 = await supabase.from("campuses").update({ sort_order: b.sort_order }).eq("id", a.id);
      if (r1.error) return r1;
      return supabase.from("campuses").update({ sort_order: a.sort_order }).eq("id", b.id);
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold">
        <Building2 className="h-4 w-4 text-primary" aria-hidden /> Campuses
      </h2>

      <div className="space-y-2">
        {campuses.map((c, i) => (
          <div key={c.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
            <Input
              defaultValue={c.name}
              className="h-9 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
              onBlur={(e) => {
                const next = e.target.value.trim();
                if (!next || next === c.name) return;
                void run("campus.renamed", next, () =>
                  supabase.from("campuses").update({ name: next }).eq("id", c.id),
                );
              }}
              aria-label={`Campus name for ${c.name}`}
            />
            <Switch
              checked={c.active}
              disabled={busy}
              onCheckedChange={(v) =>
                void run(v ? "campus.activated" : "campus.deactivated", c.name, () =>
                  supabase.from("campuses").update({ active: v }).eq("id", c.id),
                )
              }
              aria-label={`Toggle ${c.name}`}
            />
            <Button size="icon" variant="ghost" disabled={busy || i === 0} onClick={() => void move(i, -1)} aria-label="Move up">
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={busy || i === campuses.length - 1}
              onClick={() => void move(i, 1)}
              aria-label="Move down"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={busy}
              onClick={() =>
                void run("campus.deleted", c.name, () => supabase.from("campuses").delete().eq("id", c.id))
              }
              aria-label={`Delete ${c.name}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a campus" />
        <Button
          className="shrink-0 rounded-full"
          disabled={busy || !name.trim()}
          onClick={() =>
            void run("campus.added", name.trim(), async () => {
              const res = await supabase
                .from("campuses")
                .insert({ name: name.trim(), sort_order: campuses.length });
              if (!res.error) setName("");
              return res;
            })
          }
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add
        </Button>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
