import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: dataError } = await supabaseAdmin.rpc("delete_user_account_data", {
      _user_id: context.userId,
    });
    if (dataError) {
      console.error("delete_account_data_failed", dataError.message);
      throw new Error("account_delete_failed");
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (authError) {
      console.error("delete_account_auth_failed", authError.message);
      throw new Error("account_delete_failed");
    }

    return { deleted: true };
  });