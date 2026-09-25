import { Platform } from '@prisma/client';

/**
 * Contrato único que TODA plataforma implementa.
 * O núcleo do sistema conhece apenas esta interface — nunca detalhes de ML,
 * Shopee, etc. É isso que mantém o ERP leve e permite plugar/desplugar canais.
 *
 * Ver docs/02-Arquitetura.md §2.
 */

export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  externalSellerId?: string;
}

/** Contexto mínimo de uma loja para chamadas autenticadas. */
export interface StoreCtx {
  storeId: string;
  tenantId: string;
  externalSellerId?: string;
  accessToken: string;
}

export interface ListingInput {
  sku: string;
  title: string;
  priceCents: number;
  stock: number;
}

export interface NormalizedOrderItem {
  sku?: string;
  title: string;
  qty: number;
  unitPriceCents: number;
}

export interface NormalizedOrder {
  externalId: string;
  status:
    | 'pending'
    | 'paid'
    | 'ready_to_ship'
    | 'shipped'
    | 'delivered'
    | 'canceled';
  totalCents: number;
  platformFeeCents: number;
  buyerName?: string;
  shipping?: Record<string, unknown>;
  placedAt: Date;
  items: NormalizedOrderItem[];
}

export interface NormalizedMessage {
  externalThreadId: string;
  buyerName?: string;
  body: string;
  receivedAt: Date;
}

export interface Tracking {
  code?: string;
  carrier?: string;
}

export interface WebhookEvent {
  type: 'order' | 'question' | 'item' | 'unknown';
  externalId: string;
  raw: unknown;
}

export interface MarketplaceAdapter {
  readonly platform: Platform;

  // ---- OAuth ----
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<TokenSet>;
  refreshToken(refreshToken: string): Promise<TokenSet>;

  // ---- Produtos / anúncios ----
  publishListing(store: StoreCtx, listing: ListingInput): Promise<string>; // externalId
  updateStock(store: StoreCtx, externalId: string, qty: number): Promise<void>;
  updatePrice(store: StoreCtx, externalId: string, priceCents: number): Promise<void>;

  // ---- Pedidos ----
  fetchOrders(store: StoreCtx, since: Date): Promise<NormalizedOrder[]>;
  markShipped(store: StoreCtx, externalOrderId: string, tracking?: Tracking): Promise<void>;

  // ---- Mensagens (opcional) ----
  fetchMessages?(store: StoreCtx, since: Date): Promise<NormalizedMessage[]>;
  replyMessage?(store: StoreCtx, threadId: string, text: string): Promise<void>;

  // ---- Webhooks ----
  verifyWebhook(headers: Record<string, string>, rawBody: string): boolean;
  parseWebhook(rawBody: string): WebhookEvent;
}

/** Erro padrão para canais ainda não disponíveis (TikTok/Shein). */
export class ChannelNotAvailableError extends Error {
  constructor(platform: Platform, reason: string) {
    super(`Canal ${platform} indisponível: ${reason}`);
    this.name = 'ChannelNotAvailableError';
  }
}
