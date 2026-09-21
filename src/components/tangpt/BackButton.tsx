import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "./Language";

export function BackButton({ to = "/", label }: { to?: string; label?: string }) {
  const router = useRouter();
  const { t } = useLang();
  return <Button variant="ghost" size="sm" aria-label={t("Quay lại", "Back")} onClick={() => {
    if (window.history.length > 1) router.history.back();
    else router.navigate({ to });
  }}><ArrowLeft />{label ?? t("Quay lại", "Back")}</Button>;
}
