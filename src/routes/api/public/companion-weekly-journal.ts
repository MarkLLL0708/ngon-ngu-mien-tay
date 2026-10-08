import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/** Weekly job: each active companion writes one private journal entry. */
export const Route = createFileRoute("/api/public/companion-weekly-journal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response(JSON.stringify({ error: "config" }), { status: 500 });
        let companionId: string | undefined;
        try {
          const body = (await request.json()) as { companion_id?: unknown };
          if (typeof body.companion_id === "string" && /^[0-9a-f-]{36}$/i.test(body.companion_id)) companionId = body.companion_id;
        } catch { /* empty body */ }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { runWeeklyJournal } = await import("@/lib/journal.server");
        const result = await runWeeklyJournal(supabaseAdmin, apiKey, { companionId });
        return new Response(JSON.stringify({
          generated: result.processed.filter((r) => r.ok).length,
          failed: result.processed.filter((r) => !r.ok).length,
          halted: result.halted,
        }), { headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
