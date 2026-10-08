import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type JournalEntry = { id: string; entry_date: string; content: string; mood_tag: string; image_url: string | null };

/** Read-only list of a companion's journal for its owner, with signed image URLs. */
export const listJournal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { companion_id: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data?.companion_id ?? "")) throw new Error("invalid");
    return data;
  })
  .handler(async ({ data, context }): Promise<JournalEntry[]> => {
    const { supabase } = context;
    const { data: rows } = await supabase.from("companion_journal_entries")
      .select("id, entry_date, content, mood_tag, image_source, image_id")
      .eq("companion_id", data.companion_id)
      .order("entry_date", { ascending: false }).limit(60);
    const list = (rows ?? []) as { id: string; entry_date: string; content: string; mood_tag: string; image_source: string | null; image_id: string | null }[];
    return Promise.all(list.map(async (row) => {
      let image_url: string | null = null;
      if (row.image_id && row.image_source) {
        const table = row.image_source === "persona" ? "persona_image_moments" : "shared_image_moments";
        const { data: img } = await supabase.from(table).select("image_url").eq("id", row.image_id).maybeSingle();
        let url = (img as { image_url?: string } | null)?.image_url ?? "";
        if (url && !url.startsWith("http")) {
          const { data: signed } = await supabase.storage.from("persona-media").createSignedUrl(url, 3600);
          url = signed?.signedUrl ?? "";
        }
        image_url = url || null;
      }
      return { id: row.id, entry_date: row.entry_date, content: row.content, mood_tag: row.mood_tag, image_url };
    }));
  });
