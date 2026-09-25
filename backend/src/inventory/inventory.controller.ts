import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsInt, IsString, MinLength, NotEquals } from 'class-validator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { InventoryService } from './inventory.service';

class AdjustDto {
  @IsInt()
  @NotEquals(0)
  delta!: number; // positivo = entrada, negativo = saída

  @IsString()
  @MinLength(1)
  reason!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Post(':productId/adjust')
  adjust(
    @CurrentUser() user: JwtPayload,
    @Param('productId') productId: string,
    @Body() dto: AdjustDto,
  ) {
    return this.inventory.manualAdjust(
      user.tenantId,
      productId,
      dto.delta,
      dto.reason,
      user.sub,
    );
  }

  @Get(':productId/movements')
  movements(
    @CurrentUser('tenantId') tenantId: string,
    @Param('productId') productId: string,
  ) {
    return this.inventory.movements(tenantId, productId);
  }
}
