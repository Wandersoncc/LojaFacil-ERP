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
 * Adapter do TikTok Shop — FASE 2.
 *
 * O TikTok Shop possui OpenAPI oficial (Seller/Order/Customer Service APIs) via
 * Partner Center, PORÉM o acesso exige aprovação de escopo e revisão de
 * categoria. Enquanto o app não for aprovado, o adapter fica atrás da feature
 * flag FEATURE_TIKTOK e recusa chamadas. Ver docs/01-PRD.md §3 e docs/04.
 */
export class TikTokAdapter implements MarketplaceAdapter {
  readonly platform = Platform.TIKTOK;

  private readonly reason =
    'integração em fase 2 — requer aprovação de escopo no TikTok Shop Partner Center';

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
