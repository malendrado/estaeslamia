import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../types/authenticated-user.type';

/**
 * Extrae el usuario autenticado (adjuntado por JwtStrategy.validate) desde el request.
 * Uso: findMine(@CurrentUser() user: AuthenticatedUser)
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
