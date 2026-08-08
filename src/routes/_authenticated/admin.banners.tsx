import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logAdminAction, useAdminBanners, bannerState, type AdminBanner } from "@/lib/admin";
import { EmptyState } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/banners")({
  component: AdminBanners,
});

type Filter = "all" | "live" | "scheduled" | "inactive";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "scheduled", label: "Scheduled" },
  { value: "inactive", label: "Unpublished" },
];

const STATE_TONE: Record<string, string> = {
  live: "bg-emerald-500/10 text-emerald-600",
  scheduled: "bg-primary/10 text-primary",
  expired: "bg-muted text-muted-foreground",
  inactive: "bg-destructive/10 text-destructive",
};

const emptyDraft = {
  title: "",
  description: "",
  image_url: "",
  accent: "",
  campus: "",
  starts_at: "",
  ends_at: "",
};

function AdminBanners() {
  const { isAdmin, userId } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState(emptyDraft);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { data: banners = [], isLoading, error } = useAdminBanners(isAdmin);

  const list = (banners as AdminBanner[]).filter((b) => {
    if (filter === "all") return true;
    const state = bannerState(b);
    if (filter === "live") return state === "live";
    if (filter === "scheduled") return state === "scheduled";
    return state === "inactive" || state === "expired";
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    queryClient.invalidateQueries({ queryKey: ["event-banner"] });
  }

  async function create() {
    if (!draft.title.trim()) {
      toast.error("Give the banner a title");
      return;
    }
    setSaving(true);
    const { error: err } = await supabase.from("event_banners").insert({
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      image_url: draft.image_url.trim() || null,
      accent: draft.accent.trim() || null,
      campus: draft.campus.trim() || null,
      starts_at: draft.starts_at || null,
      ends_at: draft.ends_at || null,
      active: true,
    });
    setSaving(false);
    if (err) {
      toast.error(err.message);
      return;
    }
    await logAdminAction(userId, "banner.created", draft.title.trim());
    setDraft(emptyDraft);
    setOpen(false);
    refresh();
    toast.success("Banner created");
  }

  async function patch(id: string, values: Partial<AdminBanner>, message: string) {
    const { error: err } = await supabase.from("event_banners").update(values).eq("id", id);
    if (err) {
      toast.error(err.message);
      return;
    }
    await logAdminAction(userId, "banner.updated", `${id} · ${message}`);
    refresh();
    toast.success(message);
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from("event_banners").delete().eq("id", id);
    if (err) {
      toast.error(err.message);
      return;
    }
    await logAdminAction(userId, "banner.deleted", id);
    refresh();
    toast.success("Banner deleted");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-extrabold">Banners</h2>
        <Button size="sm" className="h-9 rounded-full" onClick={() => setOpen((v) => !v)}>
          <Plus className="mr-1 h-4 w-4" />
          {open ? "Close" : "New banner"}
        </Button>
      </div>

      {open && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="space-y-1.5">
            <Label htmlFor="b-title">Title</Label>
            <Input
              id="b-title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Freshers week swap fest"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-desc">Description</Label>
            <Textarea
              id="b-desc"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="What is this banner about?"
              rows={2}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="b-campus">Campus</Label>
              <Input
                id="b-campus"
                value={draft.campus}
                onChange={(e) => setDraft({ ...draft, campus: e.target.value })}
                placeholder="Leave empty for all campuses"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-accent">Accent colour</Label>
              <Input
                id="b-accent"
                value={draft.accent}
                onChange={(e) => setDraft({ ...draft, accent: e.target.value })}
                placeholder="#E8A317"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-start">Starts on</Label>
              <Input
                id="b-start"
                type="date"
                value={draft.starts_at}
                onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-end">Ends on</Label>
              <Input
                id="b-end"
                type="date"
                value={draft.ends_at}
                onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-image">Image URL</Label>
            <Input
              id="b-image"
              value={draft.image_url}
              onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <Button className="w-full rounded-full" disabled={saving} onClick={create}>
            {saving ? "Creating…" : "Create banner"}
          </Button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === f.value
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <EmptyState variant="idea" title="No banners yet" description="Create one to highlight a campus event." />
      ) : (
        list.map((b) => {
          const state = bannerState(b);
          return (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{b.title}</p>
                  {b.description && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{b.description}</p>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                    STATE_TONE[state],
                  )}
                >
                  {state}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {b.campus ? `Campus: ${b.campus}` : "All campuses"} ·{" "}
                {b.starts_at ? `from ${b.starts_at}` : "no start date"} ·{" "}
                {b.ends_at ? `until ${b.ends_at}` : "no end date"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={b.active ? "outline" : "default"}
                  className="h-8 rounded-full"
                  onClick={() =>
                    patch(b.id, { active: !b.active }, b.active ? "Banner unpublished" : "Banner published")
                  }
                >
                  {b.active ? "Unpublish" : "Publish"}
                </Button>
                <Input
                  type="date"
                  value={b.starts_at ?? ""}
                  onChange={(e) => patch(b.id, { starts_at: e.target.value || null }, "Schedule updated")}
                  className="h-8 w-36 rounded-full text-xs"
                  aria-label={`Start date for ${b.title}`}
                />
                <Input
                  type="date"
                  value={b.ends_at ?? ""}
                  onChange={(e) => patch(b.id, { ends_at: e.target.value || null }, "Schedule updated")}
                  className="h-8 w-36 rounded-full text-xs"
                  aria-label={`End date for ${b.title}`}
                />
                <Input
                  value={b.campus ?? ""}
                  onChange={(e) => patch(b.id, { campus: e.target.value.trim() || null }, "Campus updated")}
                  placeholder="All campuses"
                  className="h-8 w-40 rounded-full text-xs"
                  aria-label={`Campus for ${b.title}`}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-full text-destructive"
                  onClick={() => remove(b.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
