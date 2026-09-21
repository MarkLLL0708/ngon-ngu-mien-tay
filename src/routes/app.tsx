import { createFileRoute } from "@tanstack/react-router";
import { AppExperience } from "@/components/tangpt/AppExperience";
export const Route = createFileRoute("/app")({ head:()=>({meta:[{title:"TánGPT — Gợi ý nhắn tin"},{name:"description",content:"Gợi ý trả lời và trò chuyện AI theo vùng miền Việt Nam."},{property:"og:title",content:"TánGPT — Gợi ý nhắn tin"},{property:"og:description",content:"Gợi ý trả lời và trò chuyện AI theo vùng miền Việt Nam."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}), component: AppExperience });
