import { Badge } from "@/components/ui/badge";
import type { OrderStatus, Platform, StoreSyncStatus } from "@/types";

export const platformLabels: Record<Platform, string> = {
  MELI: "Mercado Livre",
  SHOPEE: "Shopee",
  TIKTOK: "TikTok Shop",
  SHEIN: "Shein",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  ready_to_ship: "A enviar",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const colors: Record<Platform, string> = {
    MELI: "bg-yellow-100 text-yellow-800",
    SHOPEE: "bg-orange-100 text-orange-800",
    TIKTOK: "bg-neutral-200 text-neutral-800",
    SHEIN: "bg-neutral-200 text-neutral-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[platform]}`}
    >
      {platformLabels[platform]}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant: Record<
    OrderStatus,
    "default" | "secondary" | "success" | "warning" | "destructive"
  > = {
    pending: "warning",
    paid: "secondary",
    ready_to_ship: "warning",
    shipped: "default",
    delivered: "success",
    canceled: "destructive",
  };
  return <Badge variant={variant[status]}>{orderStatusLabels[status]}</Badge>;
}

export function SyncStatusBadge({ status }: { status: StoreSyncStatus }) {
  const map: Record<
    StoreSyncStatus,
    { label: string; variant: "success" | "warning" | "destructive" | "secondary" }
  > = {
    ok: { label: "Sincronizado", variant: "success" },
    syncing: { label: "Sincronizando", variant: "warning" },
    error: { label: "Erro", variant: "destructive" },
    disconnected: { label: "Desconectado", variant: "secondary" },
  };
  return <Badge variant={map[status].variant}>{map[status].label}</Badge>;
}
