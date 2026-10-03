import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertSuperAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("get_my_admin_role");
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (row?.role !== "super_admin") throw new Error("Forbidden");
}

async function findUserIdByEmail(admin: any, email: string) {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((u: any) => (u.email ?? "").toLowerCase() === target);
    if (hit) return hit.id as string;
    if (data.users.length < 200) break;
  }
  return null;
}

/** Super Admin: list college admins with their emails. */
export const listCollegeAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("id,user_id,college_id,role,created_at")
      .eq("role", "college_admin");
    if (error) throw new Error(error.message);
    const out: { id: string; user_id: string; college_id: string | null; email: string; name: string }[] = [];
    for (const r of roles ?? []) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
      const { data: p } = await supabaseAdmin.from("profiles").select("full_name").eq("id", r.user_id).maybeSingle();
      out.push({ id: r.id, user_id: r.user_id, college_id: r.college_id, email: u.user?.email ?? "", name: p?.full_name ?? "" });
    }
    return out;
  });

/** Super Admin: assign a College Admin by email. */
export const assignCollegeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().email().max(255), collegeId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = await findUserIdByEmail(supabaseAdmin, data.email);
    if (!userId) throw new Error("No SwapSpace account uses that email yet. Ask them to sign up first.");
    const { data: existing } = await supabaseAdmin
      .from("user_roles").select("id").eq("user_id", userId).eq("role", "college_admin").maybeSingle();
    if (existing) {
      await supabaseAdmin.from("user_roles").update({ college_id: data.collegeId }).eq("id", existing.id);
    } else {
      const { error } = await supabaseAdmin.from("user_roles").insert({
        user_id: userId, role: "college_admin", college_id: data.collegeId, created_by: context.userId,
      });
      if (error) throw new Error(error.message);
    }
    await supabaseAdmin.from("admin_logs").insert({
      admin_id: context.userId, action: "Assigned college admin", target: data.email,
      college_id: data.collegeId, after: { user_id: userId, role: "college_admin" },
    });
    return { ok: true };
  });

/** Super Admin: remove a College Admin role. */
export const removeCollegeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ roleId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("user_roles").select("*").eq("id", data.roleId).maybeSingle();
    if (!row || row.role !== "college_admin") throw new Error("Not found");
    await supabaseAdmin.from("user_roles").delete().eq("id", data.roleId);
    await supabaseAdmin.from("admin_logs").insert({
      admin_id: context.userId, action: "Removed college admin", target: row.user_id,
      college_id: row.college_id, before: row,
    });
    return { ok: true };
  });
