import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logAdminAction, useAdminCategories, useCategoryUsage } from "@/lib/admin";
import { EmptyState } from "@/components/brand";
import { CategoryIcon } from "@/components/category-icon";
import { ListSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

const ICONS = ["Laptop", "BookOpen", "Shirt", "Lamp", "Dumbbell", "PenLine", "Package"];

function slugify(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type Draft = { id?: string; name: string; slug: string; icon: string; active: boolean };
const EMPTY: Draft = { name: "", slug: "", icon: "Package", active: true };

function AdminCategories() {
  const { isAdmin, userId } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const { data: categories = [], isLoading } = useAdminCategories(isAdmin);
  const { data: usage } = useCategoryUsage(isAdmin);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
  }

  async function save() {
    if (!draft) return;
    const name = draft.name.trim();
    const slug = slugify(draft.slug || draft.name);
    if (name.length < 2 || !slug) {
      toast.error("Give the category a name");
      return;
    }
    if (categories.some((c) => c.slug.toLowerCase() === slug && c.id !== draft.id)) {
      toast.error("That slug is already used");
      return;
    }
    setBusy(true);
    if (draft.id) {
      const { error } = await supabase
        .from("categories")
        .update({ name, slug, icon: draft.icon, active: draft.active })
        .eq("id", draft.id);
      setBusy(false);
      if (error) return toastError(error.message);
      await logAdminAction(userId, "category.updated", name);
    } else {
      const max = categories.reduce((m, c) => Math.max(m, c.sort_order), 0);
      const { error } = await supabase
        .from("categories")
        .insert({ name, slug, icon: draft.icon, active: draft.active, sort_order: max + 1 });
      setBusy(false);
      if (error) return toastError(error.message);
      await logAdminAction(userId, "category.created", name);
    }
    setDraft(null);
    refresh();
    toast.success("Category saved");
  }

  function toastError(m: string) {
    toast.error(m);
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = categories.findIndex((c) => c.id === id);
    const swap = categories[idx + dir];
    const cur = categories[idx];
    if (!swap || !cur) return;
    await Promise.all([
      supabase.from("categories").update({ sort_order: swap.sort_order }).eq("id", cur.id),
      supabase.from("categories").update({ sort_order: cur.sort_order }).eq("id", swap.id),
    ]);
    refresh();
  }

  async function toggleActive(id: string, active: boolean, name: string) {
    const { error } = await supabase.from("categories").update({ active }).eq("id", id);
    if (error) return toastError(error.message);
    await logAdminAction(userId, active ? "category.activated" : "category.deactivated", name);
    refresh();
  }

  async function remove(id: string, name: string) {
    const count = usage?.get(id) ?? 0;
    if (count > 0) {
      toast.error(`${count} listing${count > 1 ? "s" : ""} still use "${name}". Move them first or hide the category.`);
      return;
    }
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toastError(error.message);
    await logAdminAction(userId, "category.deleted", name);
    refresh();
    toast.success("Category removed");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-extrabold">Categories</h2>
        <Button size="sm" className="h-8 rounded-full" onClick={() => setDraft({ ...EMPTY })}>
          <Plus className="mr-1 h-3.5 w-3.5" /> New
        </Button>
      </div>

      {draft && (
        <div className="space-y-3 rounded-2xl border border-primary/30 bg-card p-4">
          <p className="font-display text-sm font-bold">{draft.id ? "Edit category" : "New category"}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={draft.name}
                maxLength={40}
                onChange={(e) =>
                  setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={draft.slug}
                maxLength={40}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  onClick={() => setDraft({ ...draft, icon: i })}
                  aria-label={i}
                  className={
                    "grid h-10 w-10 place-items-center rounded-xl border " +
                    (draft.icon === i ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")
                  }
                >
                  <CategoryIcon name={i} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} id="cat-active" />
            <Label htmlFor="cat-active">Visible on the market</Label>
          </div>
          <div className="flex gap-2">
            <Button className="rounded-full" onClick={() => void save()} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
            <Button variant="ghost" className="rounded-full" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : categories.length === 0 ? (
        <EmptyState variant="idea" title="No categories yet" description="Create the first category students can browse." />
      ) : (
        categories.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent">
              <CategoryIcon name={c.icon} className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {c.name}
                {!c.active && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    hidden
                  </span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">
                /{c.slug} · {usage?.get(c.id) ?? 0} listings
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled={i === 0} onClick={() => void move(c.id, -1)} aria-label="Move up">
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={i === categories.length - 1}
                onClick={() => void move(c.id, 1)}
                aria-label="Move down"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Switch
                checked={c.active}
                onCheckedChange={(v) => void toggleActive(c.id, v, c.name)}
                aria-label={`Toggle ${c.name}`}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => void remove(c.id, c.name)}
                aria-label={`Delete ${c.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))
      )}

      {categories.length > 0 && (
        <button
          className="w-full text-left text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => setDraft(null)}
        >
          Tip: tap a row's arrows to reorder how categories appear on the market.
        </button>
      )}

      <div className="hidden">
        {categories.map((c) => (
          <button key={c.id} onClick={() => setDraft({ id: c.id, name: c.name, slug: c.slug, icon: c.icon ?? "Package", active: c.active })} />
        ))}
      </div>
    </div>
  );
}
