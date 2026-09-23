ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS character_romance_style text NOT NULL DEFAULT 'ấm áp, tinh tế, tiến triển tự nhiên';

ALTER TABLE public.companions
  ADD COLUMN IF NOT EXISTS character_romance_style text NOT NULL DEFAULT 'ấm áp, tinh tế, tiến triển tự nhiên',
  ADD COLUMN IF NOT EXISTS romance_intensity integer NOT NULL DEFAULT 0;

UPDATE public.personas
SET character_romance_style = CASE
  WHEN personality ~* '(tinh nghịch|hài hước|vui tính|năng động)' THEN 'tinh nghịch, hay trêu, dùng ẩn ý vừa phải'
  WHEN personality ~* '(thẳng|cá tính|tự tin)' THEN 'tự tin, trực tiếp, chủ động nhưng tôn trọng'
  WHEN personality ~* '(dịu|hiền|e ấp)' THEN 'rụt rè vừa phải, ấm áp, mở lòng dần dần'
  WHEN personality ~* '(chín chắn|tinh tế|điềm tĩnh)' THEN 'chín chắn, tinh tế, thừa nhận cảm xúc rõ ràng'
  ELSE 'ấm áp, tinh tế, tiến triển tự nhiên'
END
WHERE character_romance_style = 'ấm áp, tinh tế, tiến triển tự nhiên';

UPDATE public.companions AS c
SET character_romance_style = COALESCE(
  NULLIF(p.character_romance_style, ''),
  CASE
    WHEN c.personality ~* '(tinh nghịch|hài hước|vui tính|năng động)' THEN 'tinh nghịch, hay trêu, dùng ẩn ý vừa phải'
    WHEN c.personality ~* '(thẳng|cá tính|tự tin)' THEN 'tự tin, trực tiếp, chủ động nhưng tôn trọng'
    WHEN c.personality ~* '(dịu|hiền|e ấp)' THEN 'rụt rè vừa phải, ấm áp, mở lòng dần dần'
    WHEN c.personality ~* '(chín chắn|tinh tế|điềm tĩnh)' THEN 'chín chắn, tinh tế, thừa nhận cảm xúc rõ ràng'
    ELSE 'ấm áp, tinh tế, tiến triển tự nhiên'
  END
)
FROM public.personas AS p
WHERE p.slug = c.persona_slug;

ALTER TABLE public.companions
  ADD CONSTRAINT companions_romance_intensity_range
  CHECK (romance_intensity BETWEEN 0 AND 6);

COMMENT ON COLUMN public.personas.character_romance_style IS 'Distinct adult romantic communication style for this persona.';
COMMENT ON COLUMN public.companions.character_romance_style IS 'Snapshot of the persona romantic style for this conversation.';
COMMENT ON COLUMN public.companions.romance_intensity IS 'Dynamic adult-romance conversation intensity from 0 neutral to 6 emotionally intimate.';