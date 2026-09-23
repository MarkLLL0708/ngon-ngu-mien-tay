import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PersonaThumb } from "./PersonaThumb";
import { ImagePoolPanel } from "./ImagePoolPanel";

import { listAllPersonas, type PersonaRow } from "@/lib/tangpt-personas";
import { supabase } from "@/integrations/supabase/client";
import { regions, type RegionKey } from "@/lib/tangpt-data";

export function PersonaAdminList() {
  const [rows, setRows] = useState<PersonaRow[] | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { listAllPersonas().then(setRows); }, []);

  async function togglePublished(row: PersonaRow, value: boolean) {
    setRows((current) => (current ?? []).map((item) => (item.id === row.id ? { ...item, published: value } : item)));
    await supabase.from("personas").update({ published: value, updated_at: new Date().toISOString() }).eq("id", row.id);
  }

  async function createPersona() {
    if (creating) return;
    setCreating(true);
    const slug = `nhan-vat-${Date.now().toString(36)}`;
    const { data } = await supabase.from("personas").insert({ slug, name: "Nhân vật mới", published: false, sort_order: 999 }).select("id").single();
    setCreating(false);
    if (data?.id) window.location.href = `/app/admin/personas/${data.id}`;
  }

  return <section className="tab-page">
    <div className="row-title">
      <div className="page-title"><span>QUẢN TRỊ</span><h1>Nhân vật</h1></div>
      <Button variant="gradient" size="icon" aria-label="Tạo nhân vật" onClick={createPersona}><Plus /></Button>
    </div>

    <ImagePoolPanel />

    {!rows && <p className="text-sm text-muted-foreground">Đang tải…</p>}


    <div className="admin-list">
      {(rows ?? []).map((row) => <div className="admin-row" key={row.id}>
        <PersonaThumb path={row.gallery_urls[0] ?? ""} name={row.name} />
        <div className="admin-row-main">
          <strong>{row.name}</strong>
          <small>{regions[row.region as RegionKey]?.name ?? row.region} · {row.persona_gender === "male" ? "Nam" : "Nữ"}</small>
        </div>
        <div className="admin-row-actions">
          <Switch checked={row.published} onCheckedChange={(value) => togglePublished(row, value)} aria-label="Hiển thị" />
          <Button asChild variant="outline" size="sm"><Link to="/app/admin/personas/$personaId" params={{ personaId: row.id }}>Sửa</Link></Button>
        </div>
      </div>)}
    </div>
  </section>;
}
