import { Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function Paywall({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="glass-sheet max-w-md rounded-t-[24px] sm:rounded-[24px]">
    <button aria-label="Đóng" onClick={() => onOpenChange(false)} className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-secondary"><X className="size-4" /></button>
    <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary"><Crown /></div>
    <DialogTitle className="text-center text-2xl font-extrabold">Bạn đã dùng hết lượt hôm nay</DialogTitle>
    <DialogDescription className="text-center">Mai mình lại tán tiếp, hoặc nâng cấp để không bị ngắt mạch.</DialogDescription>
    <div className="grid grid-cols-2 gap-3"><div className="plan-card"><strong>Miễn phí</strong><span>5 gợi ý/ngày</span><span>1 nhân vật AI</span><span>Trí nhớ ngắn</span></div><div className="plan-card border-primary/50 bg-primary/10"><strong>Pro</strong><b>149.000đ/tháng</b><span>Nhắn không giới hạn</span><span>Nhiều nhân vật</span><span>Trí nhớ dài hơn</span><span>Gợi ý không giới hạn</span></div></div>
    <Button disabled variant="gradient" size="lg">Nâng cấp Pro (sắp có)</Button>
  </DialogContent></Dialog>;
}
