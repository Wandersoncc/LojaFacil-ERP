import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { OrderStatus, Platform } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { OrdersService } from './orders.service';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(
    @CurrentUser('tenantId') tenantId: string,
    @Query('storeId') storeId?: string,
    @Query('platform') platform?: Platform,
    @Query('status') status?: OrderStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.orders.list(tenantId, {
      storeId,
      platform,
      status,
      from,
      to,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('dashboard')
  dashboard(@CurrentUser('tenantId') tenantId: string) {
    return this.orders.dashboard(tenantId);
  }

  @Get(':id')
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.orders.findOne(tenantId, id);
  }
}
