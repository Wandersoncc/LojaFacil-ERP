import { Platform } from '@prisma/client';
import {
  MarketplaceAdapter,
  StoreCtx,
  ListingInput,
  NormalizedOrder,
  TokenSet,
  Tracking,
  WebhookEvent,
} from '../marketplace-adapter.interface';

/**
 * Adapter da Shopee (MVP).
 *
 * A Shopee Open Platform usa assinatura HMAC-SHA256 (partner_id + partner_key)
 * em cada request, fluxo de autorização de loja (shop) e push de webhooks.
 * Esqueleto define a estrutura; implementação HTTP na Fase 1 (ver docs/04).
 *
 * Referência:
 *   - Auth:   /api/v2/shop/auth_partner
 *   - Token:  /api/v2/auth/token/get
 *   - Orders: /api/v2/order/get_order_list
 *   - Stock:  /api/v2/product/update_stock
 */
export class ShopeeAdapter implements MarketplaceAdapter {
  readonly platform = Platform.SHOPEE;

  constructor(
    private readonly partnerId: string,
    private readonly partnerKey: string,
    private readonly redirectUri: string,
  ) {}

  getAuthUrl(state: string): string {
    // Shopee: montar path + timestamp + sign HMAC(partner_key).
    // Placeholder de estrutura; assinatura real na fase 1.
    const params = new URLSearchParams({
      partner_id: this.partnerId,
      redirect: this.redirectUri,
      state,
    });
    return `https://partner.shopeemobile.com/api/v2/shop/auth_partner?${params.toString()}`;
  }

  async exchangeCode(_code: string): Promise<TokenSet> {
    throw new Error('ShopeeAdapter.exchangeCode not implemented (fase 1)');
  }

  async refreshToken(_refreshToken: string): Promise<TokenSet> {
    throw new Error('ShopeeAdapter.refreshToken not implemented (fase 1)');
  }

  async publishListing(_store: StoreCtx, _listing: ListingInput): Promise<string> {
    throw new Error('ShopeeAdapter.publishListing not implemented (fase 1)');
  }

  async updateStock(_store: StoreCtx, _externalId: string, _qty: number): Promise<void> {
    throw new Error('ShopeeAdapter.updateStock not implemented (fase 1)');
  }

  async updatePrice(_store: StoreCtx, _externalId: string, _priceCents: number): Promise<void> {
    throw new Error('ShopeeAdapter.updatePrice not implemented (fase 1)');
  }

  async fetchOrders(_store: StoreCtx, _since: Date): Promise<NormalizedOrder[]> {
    throw new Error('ShopeeAdapter.fetchOrders not implemented (fase 1)');
  }

  async markShipped(_store: StoreCtx, _orderId: string, _tracking?: Tracking): Promise<void> {
    throw new Error('ShopeeAdapter.markShipped not implemented (fase 1)');
  }

  verifyWebhook(headers: Record<string, string>, _rawBody: string): boolean {
    // Shopee envia header Authorization com HMAC do (url + body) usando partner_key.
    return Boolean(headers['authorization']);
  }

  parseWebhook(rawBody: string): WebhookEvent {
    const body = JSON.parse(rawBody);
    // code 3 = order status push, no formato push da Shopee.
    const type = body?.code === 3 ? 'order' : 'unknown';
    return {
      type,
      externalId: String(body?.data?.ordersn ?? ''),
      raw: body,
    };
  }
}
