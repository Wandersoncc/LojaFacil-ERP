import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { Platform } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { StoresService } from './stores.service';

class ConnectDto {
  @IsEnum(Platform)
  platform!: Platform;
}

@UseGuards(JwtAuthGuard)
@Controller('stores')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Get()
  list(@CurrentUser('tenantId') tenantId: string) {
    return this.stores.list(tenantId);
  }

  @Get('available-platforms')
  available() {
    return { platforms: this.stores.availablePlatforms() };
  }

  @Post('connect')
  connect(@CurrentUser('tenantId') tenantId: string, @Body() dto: ConnectDto) {
    return this.stores.startConnect(tenantId, dto.platform);
  }

  @Delete(':id')
  disconnect(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.stores.disconnect(tenantId, id);
  }
}
