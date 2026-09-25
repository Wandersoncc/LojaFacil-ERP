import { Platform } from '@prisma/client';
import {
  MarketplaceAdapter,
  StoreCtx,
  ListingInput,
  NormalizedOrder,
  TokenSet,
  Tracking,
  WebhookEvent,
  ChannelNotAvailableError,
} from '../marketplace-adapter.interface';

/**
 * Adapter da Shein — STUB / CONDICIONAL.
 *
 * ⚠️ IMPORTANTE: hoje NÃO existe Open Platform de seller pública da Shein para
 * integradores independentes no Brasil. As "APIs Shein" disponíveis no mercado
 * são de terceiros/scraping ou EDI enterprise — o que viola o requisito de
 * "APIs oficiais, sem scraping agressivo".
 *
 * Por isso este adapter é um STUB deliberado, atrás da flag FEATURE_SHEIN
 * (desligada). A interface já está pronta para plugar a implementação real
 * no dia em que a Shein publicar uma API oficial de seller.
 *
 * Ver docs/01-PRD.md §3.
 */
export class SheinAdapter implements MarketplaceAdapter {
  readonly platform = Platform.SHEIN;

  private readonly reason =
    'sem API oficial de seller pública para integradores — aguardando abertura da plataforma';

  getAuthUrl(_state: string): string {
    throw new ChannelNotAvailableError(this.platform, this.reason);
  }
  async exchangeCode(_code: string): Promise<TokenSet> {
    throw new ChannelNotAvailableError(this.platform, this.reason);
  }
  async refreshToken(_r: string): Promise<TokenSet> {
    throw new ChannelNotAvailableError(this.platform, this.reason);
  }
  async publishListing(_s: StoreCtx, _l: ListingInput): Promise<string> {
    throw new ChannelNotAvailableError(this.platform, this.reason);
  }
  async updateStock(_s: StoreCtx, _e: string, _q: number): Promise<void> {
    throw new ChannelNotAvailableError(this.platform, this.reason);
  }
  async updatePrice(_s: StoreCtx, _e: string, _p: number): Promise<void> {
    throw new ChannelNotAvailableError(this.platform, this.reason);
  }
  async fetchOrders(_s: StoreCtx, _since: Date): Promise<NormalizedOrder[]> {
    throw new ChannelNotAvailableError(this.platform, this.reason);
  }
  async markShipped(_s: StoreCtx, _o: string, _t?: Tracking): Promise<void> {
    throw new ChannelNotAvailableError(this.platform, this.reason);
  }
  verifyWebhook(_h: Record<string, string>, _b: string): boolean {
    return false;
  }
  parseWebhook(_b: string): WebhookEvent {
    throw new ChannelNotAvailableError(this.platform, this.reason);
  }
}
