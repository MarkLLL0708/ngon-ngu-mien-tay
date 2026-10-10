import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type JournalEntry =
  | { kind: "entry"; id: string; date: string; entry_date: string; content: string; mood_tag: string; image_url: string | null }
  | { kind: "moment"; id: string; date: string; caption: string; image_url: string | null };

/** Read-only merged feed: private weekly entries + the persona's shared published moments, newest first. */
export const listJournal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { companion_id: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data?.companion_id ?? "")) throw new Error("invalid");
    return data;
  })
  .handler(async ({ data, context }): Promise<JournalEntry[]> => {
    const { supabase } = context;
    async function resolveImage(source: string | null, id: string | null) {
      if (!id || !source) return null;
      const table = source === "persona" ? "persona_image_moments" : "shared_image_moments";
      const { data: img } = await supabase.from(table).select("image_url").eq("id", id).maybeSingle();
      let url = (img as { image_url?: string } | null)?.image_url ?? "";
      if (url && !url.startsWith("http")) {
        const { data: signed } = await supabase.storage.from("persona-media").createSignedUrl(url, 3600);
        url = signed?.signedUrl ?? "";
      }
      return url || null;
    }
    const { data: rows } = await supabase.from("companion_journal_entries")
      .select("id, entry_date, created_at, content, mood_tag, image_source, image_id")
      .eq("companion_id", data.companion_id)
      .order("entry_date", { ascending: false }).limit(60);
    const entries = await Promise.all((rows ?? []).map(async (row): Promise<JournalEntry> => ({
      kind: "entry", id: row.id, date: row.created_at, entry_date: row.entry_date, content: row.content,
      mood_tag: row.mood_tag, image_url: await resolveImage(row.image_source, row.image_id),
    })));

    // Only show moments when the user owns this companion (RLS on companions).
    const { data: comp } = await supabase.from("companions").select("persona_slug").eq("id", data.companion_id).maybeSingle();
    let moments: JournalEntry[] = [];
    if (comp?.persona_slug) {
      const { data: persona } = await supabase.from("personas").select("id").eq("slug", comp.persona_slug).maybeSingle();
      if (persona) {
        const { data: mrows } = await supabase.from("persona_moments")
          .select("id, caption, image_source, image_id, posted_at")
          .eq("persona_id", persona.id).eq("published", true)
          .order("posted_at", { ascending: false }).limit(60);
        moments = await Promise.all((mrows ?? []).map(async (m): Promise<JournalEntry> => ({
          kind: "moment", id: m.id, date: m.posted_at, caption: m.caption,
          image_url: await resolveImage(m.image_source, m.image_id),
        })));
      }
    }
    return [...entries, ...moments].sort((a, b) => b.date.localeCompare(a.date));
  });
