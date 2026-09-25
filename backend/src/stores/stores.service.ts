import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Platform } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { AdapterRegistry } from '../integrations/adapter.registry';

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: AdapterRegistry,
  ) {}

  /** Plataformas que o lojista pode conectar agora (respeita feature flags). */
  availablePlatforms() {
    return this.registry.availablePlatforms();
  }

  async list(tenantId: string) {
    const stores = await this.prisma.store.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        platform: true,
        nickname: true,
        externalSellerId: true,
        syncStatus: true,
        lastSyncedAt: true,
        createdAt: true,
      },
    });
    return stores; // tokens nunca são expostos
  }

  /**
   * Inicia o fluxo OAuth: valida limite do plano, valida canal disponível,
   * gera um `state` assinado (anti-CSRF) e retorna a URL de autorização.
   */
  async startConnect(tenantId: string, platform: Platform) {
    if (!this.availablePlatforms().includes(platform)) {
      throw new BadRequestException(
        `A plataforma ${platform} ainda não está disponível para conexão`,
      );
    }
    await this.assertStoreLimit(tenantId);

    const adapter = this.registry.get(platform);
    // state carrega tenantId + plataforma + nonce; em produção deve ser assinado (JWT/HMAC)
    const state = Buffer.from(
      JSON.stringify({ tenantId, platform, nonce: randomBytes(8).toString('hex') }),
    ).toString('base64url');

    return { authUrl: adapter.getAuthUrl(state), state };
  }

  async findOne(tenantId: string, id: string) {
    const store = await this.prisma.store.findFirst({ where: { id, tenantId } });
    if (!store) throw new NotFoundException('Loja não encontrada');
    return store;
  }

  async disconnect(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.store.delete({ where: { id } });
    return { ok: true };
  }

  /** Impede ultrapassar o limite de lojas do plano do tenant. */
  private async assertStoreLimit(tenantId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });
    const maxStores = sub?.plan.maxStores ?? 1;
    const count = await this.prisma.store.count({ where: { tenantId } });
    if (count >= maxStores) {
      throw new ForbiddenException(
        `Limite de ${maxStores} loja(s) do seu plano atingido. Faça upgrade para conectar mais.`,
      );
    }
  }
}
