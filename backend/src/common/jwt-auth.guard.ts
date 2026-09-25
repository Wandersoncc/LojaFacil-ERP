import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Exige um JWT válido. O payload (com tenantId) é anexado a request.user. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
