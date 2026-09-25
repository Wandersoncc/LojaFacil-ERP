import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt.strategy';

/**
 * Extrai o payload do JWT (userId, tenantId, role) do request.
 * Uso: metodo(@CurrentUser() user: JwtPayload)
 * Uso: metodo(@CurrentUser('tenantId') tenantId: string)
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
