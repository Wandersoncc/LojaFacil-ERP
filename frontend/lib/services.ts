import { api } from "@/lib/api";
import type {
  AuthTokens,
  AvailablePlatformsResponse,
  DashboardSummary,
  Order,
  OrderStatus,
  Paginated,
  Platform,
  Product,
  Store,
} from "@/types";

// ---------- Auth ----------
export async function login(email: string, password: string) {
  const { data } = await api.post<AuthTokens>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function register(
  email: string,
  password: string,
  name?: string,
) {
  const { data } = await api.post<AuthTokens>("/auth/register", {
    email,
    password,
    name,
  });
  return data;
}

// ---------- Products ----------
export async function getProducts(search?: string) {
  const { data } = await api.get<Product[]>("/products", {
    params: search ? { search } : undefined,
  });
  return data;
}

export interface CreateProductInput {
  sku: string;
  title: string;
  costCents?: number;
  stockAvailable?: number;
  lowStockThreshold?: number;
}

export async function createProduct(input: CreateProductInput) {
  const { data } = await api.post<Product>("/products", input);
  return data;
}

export async function getLowStock() {
  const { data } = await api.get<Product[]>("/products/low-stock");
  return data;
}

export async function adjustStock(
  productId: string,
  delta: number,
  reason: string,
) {
  const { data } = await api.post(`/inventory/${productId}/adjust`, {
    delta,
    reason,
  });
  return data;
}

// ---------- Orders ----------
export interface OrderQuery {
  storeId?: string;
  platform?: Platform;
  status?: OrderStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function getOrders(query: OrderQuery) {
  const { data } = await api.get<Paginated<Order>>("/orders", {
    params: query,
  });
  return data;
}

export async function getDashboard() {
  const { data } = await api.get<DashboardSummary>("/orders/dashboard");
  return data;
}

// ---------- Stores ----------
export async function getStores() {
  const { data } = await api.get<Store[]>("/stores");
  return data;
}

export async function getAvailablePlatforms() {
  const { data } = await api.get<AvailablePlatformsResponse>(
    "/stores/available-platforms",
  );
  return data;
}

export async function connectStore(platform: Platform) {
  const { data } = await api.post<{ authUrl: string; state: string }>(
    "/stores/connect",
    { platform },
  );
  return data;
}
