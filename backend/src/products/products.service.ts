import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { tenantId_sku: { tenantId, sku: dto.sku } },
    });
    if (existing) {
      throw new ConflictException(`Já existe um produto com o SKU ${dto.sku}`);
    }

    return this.prisma.product.create({
      data: {
        tenantId,
        sku: dto.sku,
        title: dto.title,
        costCents: dto.costCents ?? 0,
        stockAvailable: dto.stockAvailable ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 0,
      },
    });
  }

  async list(tenantId: string, search?: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        ...(search
          ? {
              OR: [
                { sku: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        listings: { select: { id: true, storeId: true, status: true } },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { listings: true },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(tenantId, id); // garante posse pelo tenant
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  /** Produtos cujo disponível (available - reserved) está no/abaixo do limite. */
  async lowStock(tenantId: string) {
    const products = await this.prisma.product.findMany({ where: { tenantId } });
    return products.filter(
      (p) =>
        p.lowStockThreshold > 0 &&
        p.stockAvailable - p.stockReserved <= p.lowStockThreshold,
    );
  }
}
