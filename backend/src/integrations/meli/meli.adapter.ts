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
 * Adapter do Mercado Livre (canal de PRIORIDADE MÁXIMA — MVP).
 *
 * A API do ML é OAuth 2.0 (authorization code) com refresh token e webhooks
 * ("notifications"). Este esqueleto define a estrutura e os pontos de chamada;
 * a implementação HTTP concreta é preenchida na Fase 1 (ver docs/04).
 *
 * Endpoints de referência (a preencher no client HTTP):
 *   - Auth:        https://auth.mercadolibre.com.br/authorization
 *   - Token:       POST https://api.mercadolibre.com/oauth/token
 *   - Orders:      GET  https://api.mercadolibre.com/orders/search
 *   - Items/stock: PUT  https://api.mercadolibre.com/items/{id}
 *   - Questions:   GET  https://api.mercadolibre.com/questions/search
 */
export class MeliAdapter implements MarketplaceAdapter {
  readonly platform = Platform.MELI;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly redirectUri: string,
  ) {}

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
    });
    return `https://auth.mercadolibre.com.br/authorization?${params.toString()}`;
  }

  async exchangeCode(_code: string): Promise<TokenSet> {
    // TODO(fase1): POST /oauth/token grant_type=authorization_code
    throw new Error('MeliAdapter.exchangeCode not implemented (fase 1)');
  }

  async refreshToken(_refreshToken: string): Promise<TokenSet> {
    // TODO(fase1): POST /oauth/token grant_type=refresh_token
    throw new Error('MeliAdapter.refreshToken not implemented (fase 1)');
  }

  async publishListing(_store: StoreCtx, _listing: ListingInput): Promise<string> {
    throw new Error('MeliAdapter.publishListing not implemented (fase 1)');
  }

  async updateStock(_store: StoreCtx, _externalId: string, _qty: number): Promise<void> {
    // TODO(fase1): PUT /items/{id} { available_quantity }
    throw new Error('MeliAdapter.updateStock not implemented (fase 1)');
  }

  async updatePrice(_store: StoreCtx, _externalId: string, _priceCents: number): Promise<void> {
    throw new Error('MeliAdapter.updatePrice not implemented (fase 1)');
  }

  async fetchOrders(_store: StoreCtx, _since: Date): Promise<NormalizedOrder[]> {
    // TODO(fase1): GET /orders/search?seller=...&order.date_created.from=...
    // Normalizar para NormalizedOrder.
    throw new Error('MeliAdapter.fetchOrders not implemented (fase 1)');
  }

  async markShipped(_store: StoreCtx, _orderId: string, _tracking?: Tracking): Promise<void> {
    throw new Error('MeliAdapter.markShipped not implemented (fase 1)');
  }

  verifyWebhook(_headers: Record<string, string>, _rawBody: string): boolean {
    // ML envia notificações; validar por topic + consulta do recurso.
    return true;
  }

  parseWebhook(rawBody: string): WebhookEvent {
    const body = JSON.parse(rawBody);
    const topic: string = body?.topic ?? 'unknown';
    const type =
      topic === 'orders_v2' || topic === 'orders'
        ? 'order'
        : topic === 'questions'
          ? 'question'
          : topic === 'items'
            ? 'item'
            : 'unknown';
    return { type, externalId: String(body?.resource ?? ''), raw: body };
  }
}
