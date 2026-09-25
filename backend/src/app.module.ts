import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { StoresModule } from './stores/stores.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';

/**
 * Monólito modular. Módulos do MVP:
 *  - auth        : autenticação JWT + multi-tenant
 *  - integrations: adapters de marketplace (ML/Shopee reais; TikTok/Shein stub)
 *  - stores      : lojas conectadas + início do OAuth
 *  - products    : SKU / catálogo (verdade de estoque)
 *  - inventory   : movimentações + reserva anti-overselling
 *  - orders      : listagem unificada + dashboard
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    IntegrationsModule,
    StoresModule,
    ProductsModule,
    InventoryModule,
    OrdersModule,
  ],
})
export class AppModule {}
