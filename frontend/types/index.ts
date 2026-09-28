export type Platform = "MELI" | "SHOPEE" | "TIKTOK" | "SHEIN";

export type OrderStatus =
  | "pending"
  | "paid"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "canceled";

export type ListingStatus = "active" | "paused" | "closed" | "sync_error";

export type StoreSyncStatus = "ok" | "syncing" | "error" | "disconnected";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Listing {
  id: string;
  storeId: string;
  status: ListingStatus;
}

export interface Product {
  id: string;
  sku: string;
  title: string;
  costCents: number;
  stockAvailable: number;
  stockReserved: number;
  lowStockThreshold: number;
  createdAt: string;
  listings?: Listing[];
}

export interface Store {
  id: string;
  platform: Platform;
  nickname: string;
  externalSellerId: string | null;
  syncStatus: StoreSyncStatus;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  sku: string | null;
  title: string;
  qty: number;
  unitPriceCents: number;
}

export interface Order {
  id: string;
  externalId: string;
  status: OrderStatus;
  totalCents: number;
  platformFeeCents: number;
  buyerName: string | null;
  trackingCode: string | null;
  placedAt: string;
  store?: { nickname: string; platform: Platform };
  items?: OrderItem[];
}

export interface Paginated<T> {
  total: number;
  page: number;
  pageSize: number;
  data: T[];
}

export interface DashboardSummary {
  salesTodayCents: number;
  sales7dCents: number;
  sales30dCents: number;
  ordersByStatus: Record<string, number>;
}

export interface AvailablePlatformsResponse {
  platforms: Platform[];
}

/** Erro de API normalizado. */
export interface ApiError {
  message: string;
  statusCode?: number;
}
