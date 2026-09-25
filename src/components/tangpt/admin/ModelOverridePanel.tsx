import { useEffect, useState } from "react";
import { toast } from "sonner";
import { COMPARE_MODELS, MODEL_OVERRIDE_STORAGE_KEY, readModelOverride } from "@/lib/tangpt-config";

/** Admin-only: switch the companion model for this browser's own messages. */
export function ModelOverridePanel() {
  const [value, setValue] = useState("");
  useEffect(() => { setValue(readModelOverride() ?? ""); }, []);

  function change(next: string) {
    setValue(next);
    if (next) window.localStorage.setItem(MODEL_OVERRIDE_STORAGE_KEY, next);
    else window.localStorage.removeItem(MODEL_OVERRIDE_STORAGE_KEY);
    toast.success(next ? `Đang thử: ${next} / Testing: ${next}` : "Đã về mô hình mặc định / Back to default model");
  }

  return <div className="filter-block">
    <div className="admin-section-head"><strong>Mô hình thử nghiệm / Test model</strong></div>
    <select className="admin-select" value={value} onChange={(event) => change(event.target.value)}>
      <option value="">Mặc định / Default (openai/gpt-6-astra)</option>
      {COMPARE_MODELS.map((model) => <option key={model} value={model}>{model}</option>)}
    </select>
    <p className="text-sm text-muted-foreground">Chỉ áp dụng cho tin nhắn bạn gửi từ trình duyệt này. / Only affects messages you send from this browser.</p>
  </div>;
}
