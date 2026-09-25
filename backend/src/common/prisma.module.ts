import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Global para que qualquer módulo injete o PrismaService sem reimportar. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
