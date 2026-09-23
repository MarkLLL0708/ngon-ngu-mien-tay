import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLang } from "./Language";
import { PersonaCustomizeSheet } from "./PersonaCustomizeSheet";
import { personaBlurb, useMediaUrl, useMediaUrls, type PersonaRow } from "@/lib/tangpt-personas";
import { useProfile } from "@/lib/tangpt-profile";
import { startCompanion } from "@/lib/tangpt-personas";

export function PersonaIntro({ persona, preview }: { persona: PersonaRow; preview?: boolean }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const profile = useProfile();
  const [customize, setCustomize] = useState(false);
  const [busy, setBusy] = useState(false);
  const videoUrl = useMediaUrl(persona.intro_video_url);
  const gallery = useMediaUrls(persona.gallery_urls);
  const blurb = personaBlurb(persona);
  const tags = persona.tags.slice(0, 3);

  async function start() {
    if (preview || busy || !profile?.userId) return;
    setBusy(true);
    try {
      const id = await startCompanion(profile.userId, persona);
      navigate({ to: "/app/chat/$companionId", params: { companionId: id } });
    } finally { setBusy(false); }
  }

  return <section className="persona-intro">
    <div className="persona-intro-media">
      {videoUrl
        ? <video src={videoUrl} autoPlay loop muted playsInline />
        : gallery[0]
          ? <img src={gallery[0]} alt={persona.name} />
          : <div className="persona-intro-placeholder"><span>{persona.name[0]}</span></div>}
      <Badge variant="secondary" className="persona-ai-chip">AI</Badge>
    </div>

    <div className="persona-intro-body">
      <h1>{persona.name}{persona.age_vibe ? `, ${persona.age_vibe}` : ""}</h1>
      <p className="persona-intro-meta">{[persona.job, persona.city].filter(Boolean).join(" · ")}</p>
      {tags.length > 0 && <div className="flex flex-wrap gap-1.5">{tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>}
      {blurb && <p className="persona-intro-blurb">{blurb}</p>}

      {gallery.length > 0 && <div className="persona-gallery-strip">
        {gallery.map((url, index) => <img key={url} src={url} alt={`${persona.name} ${index + 1}`} />)}
      </div>}

      <button type="button" className="persona-customize-link" onClick={() => setCustomize(true)}>
        {t("Tùy chỉnh tính cách và cách xưng hô", "Customise personality and address")}
      </button>
    </div>

    <div className="anchored-actions">
      <Button variant="gradient" className="w-full" disabled={busy || preview} onClick={start}>
        {t("Bắt đầu nhắn tin", "Start chatting")}
      </Button>
    </div>

    {customize && <PersonaCustomizeSheet persona={persona} preview={preview ?? false} onClose={() => setCustomize(false)} />}
  </section>;
}
