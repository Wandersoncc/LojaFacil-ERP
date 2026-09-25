import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MovementType, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

/**
 * Serviço de estoque — coração do anti-overselling (ver docs/02 §3.2).
 *
 * Regras:
 *  - stockAvailable  = total físico disponível para venda
 *  - stockReserved   = já comprometido por pedidos abertos
 *  - disponível efetivo = stockAvailable - stockReserved
 *
 * Todo movimento é transacional e gera um registro em StockMovement (auditoria).
 * Após qualquer mudança, o disponível efetivo deve ser propagado às lojas
 * (job propagate-stock) — enfileirado pelo InventoryModule na integração real.
 */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Entrada (inbound) ou saída (adjust negativo) manual de estoque. */
  async manualAdjust(
    tenantId: string,
    productId: string,
    delta: number,
    reason: string,
    userId?: string,
  ) {
    if (delta === 0) throw new BadRequestException('Quantidade não pode ser zero');

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: productId, tenantId } });
      if (!product) throw new NotFoundException('Produto não encontrado');

      const newAvailable = product.stockAvailable + delta;
      if (newAvailable < 0) {
        throw new BadRequestException('Estoque disponível não pode ficar negativo');
      }

      const updated = await tx.product.update({
        where: { id: productId },
        data: { stockAvailable: newAvailable },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          productId,
          type: delta > 0 ? MovementType.inbound : MovementType.adjust,
          qty: delta,
          reason,
          createdBy: userId,
        },
      });

      return this.withEffective(updated);
    });
  }

  /**
   * Reserva estoque ao entrar um pedido (evita vender o mesmo item em 2 canais).
   * Move quantidade de "available" para "reserved" na mesma transação.
   */
  async reserve(
    tenantId: string,
    productId: string,
    qty: number,
    orderId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    if (qty <= 0) throw new BadRequestException('Quantidade inválida');
    const run = async (client: Prisma.TransactionClient) => {
      const product = await client.product.findFirst({
        where: { id: productId, tenantId },
      });
      if (!product) throw new NotFoundException('Produto não encontrado');

      const effective = product.stockAvailable - product.stockReserved;
      if (effective < qty) {
        throw new BadRequestException(
          `Estoque insuficiente para reservar (disponível: ${effective})`,
        );
      }

      const updated = await client.product.update({
        where: { id: productId },
        data: { stockReserved: product.stockReserved + qty },
      });
      await client.stockMovement.create({
        data: {
          tenantId,
          productId,
          type: MovementType.reserve,
          qty,
          reason: 'order',
          orderId,
        },
      });
      return this.withEffective(updated);
    };
    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /** Libera reserva (ex.: pedido cancelado). */
  async release(tenantId: string, productId: string, qty: number, orderId?: string) {
    if (qty <= 0) throw new BadRequestException('Quantidade inválida');
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: productId, tenantId } });
      if (!product) throw new NotFoundException('Produto não encontrado');

      const newReserved = Math.max(0, product.stockReserved - qty);
      const updated = await tx.product.update({
        where: { id: productId },
        data: { stockReserved: newReserved },
      });
      await tx.stockMovement.create({
        data: {
          tenantId,
          productId,
          type: MovementType.release,
          qty,
          reason: 'order_canceled',
          orderId,
        },
      });
      return this.withEffective(updated);
    });
  }

  /** Baixa definitiva ao enviar o pedido: consome reservado e o disponível. */
  async commitShipment(
    tenantId: string,
    productId: string,
    qty: number,
    orderId?: string,
  ) {
    if (qty <= 0) throw new BadRequestException('Quantidade inválida');
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: productId, tenantId } });
      if (!product) throw new NotFoundException('Produto não encontrado');

      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          stockAvailable: Math.max(0, product.stockAvailable - qty),
          stockReserved: Math.max(0, product.stockReserved - qty),
        },
      });
      await tx.stockMovement.create({
        data: {
          tenantId,
          productId,
          type: MovementType.outbound,
          qty: -qty,
          reason: 'shipment',
          orderId,
        },
      });
      return this.withEffective(updated);
    });
  }

  async movements(tenantId: string, productId: string) {
    return this.prisma.stockMovement.findMany({
      where: { tenantId, productId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  private withEffective<T extends { stockAvailable: number; stockReserved: number }>(
    product: T,
  ) {
    return {
      ...product,
      stockEffective: product.stockAvailable - product.stockReserved,
    };
  }
}
