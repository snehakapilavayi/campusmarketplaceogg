import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin";
import { assignCollegeAdmin, listCollegeAdmins, removeCollegeAdmin } from "@/lib/colleges.functions";
import { ListSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/colleges")({
  component: AdminColleges,
});

type Draft = { id?: string; name: string; slug: string; domain_suffix: string; city: string; active: boolean };
const EMPTY: Draft = { name: "", slug: "", domain_suffix: "", city: "", active: true };
const slugify = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function AdminColleges() {
  const { isAdmin, userId } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const listAdmins = useServerFn(listCollegeAdmins);
  const assign = useServerFn(assignCollegeAdmin);
  const remove = useServerFn(removeCollegeAdmin);

  const { data: colleges = [], isLoading } = useQuery({
    queryKey: ["admin-colleges"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("colleges").select("*").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: stats } = useQuery({
    queryKey: ["admin-college-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const [p, l, r] = await Promise.all([
        supabase.from("profiles").select("college_id").limit(5000),
        supabase.from("listings").select("college_id,status").limit(5000),
        supabase.from("reports").select("college_id").limit(5000),
      ]);
      const m = new Map<string, { users: number; listings: number; reports: number }>();
      const get = (id: string | null) => {
        const k = id ?? "none";
        if (!m.has(k)) m.set(k, { users: 0, listings: 0, reports: 0 });
        return m.get(k)!;
      };
      (p.data ?? []).forEach((x) => get(x.college_id).users++);
      (l.data ?? []).forEach((x) => { if (x.status === "approved") get(x.college_id).listings++; });
      (r.data ?? []).forEach((x) => get(x.college_id).reports++);
      return m;
    },
  });
  const { data: admins = [] } = useQuery({ queryKey: ["college-admins"], enabled: isAdmin, queryFn: () => listAdmins() });

  async function save() {
    if (!draft || !draft.name.trim()) return toast.error("Add a college name");
    const row = {
      name: draft.name.trim(),
      slug: draft.slug.trim() || slugify(draft.name),
      domain_suffix: draft.domain_suffix.trim().toLowerCase().replace(/^@/, "") || null,
      city: draft.city.trim() || null,
      active: draft.active,
    };
    const { error } = draft.id
      ? await supabase.from("colleges").update(row).eq("id", draft.id)
      : await supabase.from("colleges").insert(row);
    if (error) return toast.error(error.message);
    await logAdminAction(userId, draft.id ? "Updated college" : "Added college", row.name);
    toast.success("College saved");
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["admin-colleges"] });
  }

  async function toggle(id: string, name: string, active: boolean) {
    const { error } = await supabase.from("colleges").update({ active }).eq("id", id);
    if (error) return toast.error(error.message);
    await logAdminAction(userId, active ? "Activated college" : "Deactivated college", name);
    qc.invalidateQueries({ queryKey: ["admin-colleges"] });
  }

  async function addAdmin(collegeId: string) {
    const email = (emails[collegeId] ?? "").trim();
    if (!email) return;
    try {
      await assign({ data: { email, collegeId } });
      toast.success("College admin assigned");
      setEmails((e) => ({ ...e, [collegeId]: "" }));
      qc.invalidateQueries({ queryKey: ["college-admins"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function dropAdmin(roleId: string) {
    try {
      await remove({ data: { roleId } });
      toast.success("College admin removed");
      qc.invalidateQueries({ queryKey: ["college-admins"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Colleges</h2>
          <p className="text-sm text-muted-foreground">Onboard colleges and assign who runs each one.</p>
        </div>
        <Button className="rounded-full" onClick={() => setDraft(EMPTY)}>
          <Plus className="mr-1 h-4 w-4" /> Add college
        </Button>
      </div>

      {draft && (
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
          <Field label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
          <Field label="Short code" value={draft.slug} placeholder={slugify(draft.name)} onChange={(v) => setDraft({ ...draft, slug: v })} />
          <Field label="Email domain" value={draft.domain_suffix} placeholder="college.edu.in" onChange={(v) => setDraft({ ...draft, domain_suffix: v })} />
          <Field label="City" value={draft.city} onChange={(v) => setDraft({ ...draft, city: v })} />
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} /> Active
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="ghost" className="rounded-full" onClick={() => setDraft(null)}>Cancel</Button>
            <Button className="rounded-full" onClick={save}>Save</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-3">
          {colleges.map((c) => {
            const s = stats?.get(c.id) ?? { users: 0, listings: 0, reports: 0 };
            const rate = s.listings ? ((s.reports / s.listings) * 100).toFixed(1) : "0";
            const mine = admins.filter((a) => a.college_id === c.id);
            return (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[c.city, c.domain_suffix && `@${c.domain_suffix}`].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={c.active} onCheckedChange={(v) => toggle(c.id, c.name, v)} />
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() =>
                      setDraft({ id: c.id, name: c.name, slug: c.slug, domain_suffix: c.domain_suffix ?? "", city: c.city ?? "", active: c.active })}>
                      Edit
                    </Button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <Stat label="Students" value={s.users} />
                  <Stat label="Live listings" value={s.listings} />
                  <Stat label="Reports / 100" value={rate} />
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">College admins</p>
                  {mine.length === 0 && <p className="text-xs text-muted-foreground">None assigned yet.</p>}
                  {mine.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
                      <span>{a.name || a.email} <span className="text-muted-foreground">{a.email}</span></span>
                      <Button size="icon" variant="ghost" onClick={() => dropAdmin(a.id)} aria-label="Remove admin">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="admin@college.edu.in"
                      value={emails[c.id] ?? ""}
                      onChange={(e) => setEmails((m) => ({ ...m, [c.id]: e.target.value }))}
                    />
                    <Button className="rounded-full" onClick={() => addAdmin(c.id)}>
                      <UserPlus className="mr-1 h-4 w-4" /> Assign
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-muted px-2 py-2">
      <p className="text-base font-bold">{value}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}
