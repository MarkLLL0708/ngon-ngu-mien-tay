import type { ReactNode } from "react";
import { useIsPersonaAdmin } from "@/lib/tangpt-admin";

export function AdminGate({ children }: { children: ReactNode }) {
  const { loading, isAdmin } = useIsPersonaAdmin();
  if (loading) return <p className="text-sm text-muted-foreground">Đang kiểm tra quyền…</p>;
  if (!isAdmin) return <p className="text-sm text-muted-foreground">Trang này chỉ dành cho quản trị viên.</p>;
  return <>{children}</>;
}
