import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes the signed-in student's own account. */
export const deleteOwnAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin-only: permanently deletes a student account. */
export const deleteStudentAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[] }) => {
    if (!Array.isArray(input?.ids) || input.ids.length === 0) throw new Error("No students selected");
    return { ids: input.ids.slice(0, 100) };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Forbidden");
    if (data.ids.includes(context.userId)) throw new Error("You cannot delete your own admin account here");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const id of data.ids) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) throw new Error(error.message);
    }
    return { deleted: data.ids.length };
  });
