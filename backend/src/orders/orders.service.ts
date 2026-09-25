import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Platform, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

export interface OrderFilters {
  storeId?: string;
  platform?: Platform;
  status?: OrderStatus;
  from?: string; // ISO date
  to?: string; // ISO date
  page?: number;
  pageSize?: number;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listagem unificada de pedidos de todas as lojas com filtros básicos. */
  async list(tenantId: string, filters: OrderFilters) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

    const where: Prisma.OrderWhereInput = {
      tenantId,
      ...(filters.storeId ? { storeId: filters.storeId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.platform ? { store: { platform: filters.platform } } : {}),
      ...(filters.from || filters.to
        ? {
            placedAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { placedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          store: { select: { nickname: true, platform: true } },
          items: true,
        },
      }),
    ]);

    return { total, page, pageSize, data };
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: { store: true, items: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }

  /** Resumo para o dashboard: vendas por janela + contagem por status. */
  async dashboard(tenantId: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days7 = new Date(now.getTime() - 7 * 864e5);
    const days30 = new Date(now.getTime() - 30 * 864e5);

    const sumSince = async (since: Date) => {
      const r = await this.prisma.order.aggregate({
        where: { tenantId, placedAt: { gte: since }, status: { not: 'canceled' } },
        _sum: { totalCents: true },
      });
      return r._sum.totalCents ?? 0;
    };

    const byStatusRaw = await this.prisma.order.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
    });
    const byStatus = byStatusRaw.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {});

    return {
      salesTodayCents: await sumSince(startOfDay),
      sales7dCents: await sumSince(days7),
      sales30dCents: await sumSince(days30),
      ordersByStatus: byStatus,
    };
  }
}
