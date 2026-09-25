import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Platform } from '@prisma/client';
import { MarketplaceAdapter } from './marketplace-adapter.interface';
import { MeliAdapter } from './meli/meli.adapter';
import { ShopeeAdapter } from './shopee/shopee.adapter';
import { TikTokAdapter } from './tiktok/tiktok.adapter';
import { SheinAdapter } from './shein/shein.adapter';

/**
 * Registro central de adapters. O resto do sistema pede o adapter por
 * plataforma e nunca instancia canais diretamente.
 *
 * Canais atrás de feature flag (TikTok/Shein) só respondem se habilitados.
 */
@Injectable()
export class AdapterRegistry {
  private readonly adapters = new Map<Platform, MarketplaceAdapter>();

  constructor(private readonly config: ConfigService) {
    this.adapters.set(
      Platform.MELI,
      new MeliAdapter(
        config.get('MELI_CLIENT_ID', ''),
        config.get('MELI_CLIENT_SECRET', ''),
        config.get('MELI_REDIRECT_URI', ''),
      ),
    );

    this.adapters.set(
      Platform.SHOPEE,
      new ShopeeAdapter(
        config.get('SHOPEE_PARTNER_ID', ''),
        config.get('SHOPEE_PARTNER_KEY', ''),
        config.get('SHOPEE_REDIRECT_URI', ''),
      ),
    );

    // Canais atrás de flag — registrados mas indisponíveis por padrão.
    this.adapters.set(Platform.TIKTOK, new TikTokAdapter());
    this.adapters.set(Platform.SHEIN, new SheinAdapter());
  }

  /** Canais habilitados para conexão pelo lojista neste momento. */
  availablePlatforms(): Platform[] {
    const list: Platform[] = [Platform.MELI, Platform.SHOPEE];
    if (this.config.get('FEATURE_TIKTOK') === 'true') list.push(Platform.TIKTOK);
    if (this.config.get('FEATURE_SHEIN') === 'true') list.push(Platform.SHEIN);
    return list;
  }

  get(platform: Platform): MarketplaceAdapter {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new Error(`Adapter não registrado para plataforma ${platform}`);
    }
    return adapter;
  }
}
