import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
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
        <Field label="Allowed college email domain">
          <Input
            value={general.allowed_email_domain}
            onChange={(e) => setGeneral({ ...general, allowed_email_domain: e.target.value.trim() })}
            placeholder="vishnu.edu.in"
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
