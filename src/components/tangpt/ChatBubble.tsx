import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatBubble({ text, why, copied, onCopy }: { text: string; why?: string; copied?: boolean; onCopy?: () => void }) {
  return <div className="space-y-3 rounded-[20px] border border-primary/20 bg-primary/10 p-4">
    <p className="text-[15px] leading-6 text-foreground">{text}</p>
    {why && <p className="text-xs leading-5 text-muted-foreground"><span className="font-semibold text-foreground/80">Vì sao hiệu quả:</span> {why}</p>}
    {onCopy && <Button type="button" variant="ghost" size="sm" onClick={onCopy} className="h-9 px-2 text-primary">{copied ? <Check /> : <Copy />}{copied ? "Đã sao chép" : "Sao chép"}</Button>}
  </div>;
}
