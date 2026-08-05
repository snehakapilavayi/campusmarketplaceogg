import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function purgeUser(supabaseAdmin: Admin, id: string) {
  // Owned rows that don't cascade from profiles
  await supabaseAdmin.from("cart").delete().eq("user_id", id);
  await supabaseAdmin.from("wishlist").delete().eq("user_id", id);
  await supabaseAdmin.from("notifications").delete().eq("user_id", id);
  await supabaseAdmin.from("messages").delete().eq("sender_id", id);
  await supabaseAdmin.from("conversations").delete().or(`buyer_id.eq.${id},seller_id.eq.${id}`);
  await supabaseAdmin.from("reports").delete().eq("reporter_id", id);
  await supabaseAdmin.from("ratings").delete().eq("reviewer_id", id);
  await supabaseAdmin.from("user_roles").delete().eq("user_id", id);
  // profiles cascade → listings, listing_images, ratings received, admin logs
  await supabaseAdmin.from("profiles").delete().eq("id", id);
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error && !/not found/i.test(error.message)) throw new Error(error.message);
}

/** Permanently deletes the signed-in student's own account. */
export const deleteOwnAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await purgeUser(supabaseAdmin, context.userId);
    return { ok: true };
  });

/** Admin-only: permanently deletes student accounts. */
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
    if (data.ids.includes(context.userId)) throw new Error("You cannot delete your own admin account");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const id of data.ids) await purgeUser(supabaseAdmin, id);
    return { deleted: data.ids.length };
  });
