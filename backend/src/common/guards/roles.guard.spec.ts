import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../enums';

function buildContext(user: { role: UserRole } | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('permite el acceso si el handler no requiere roles específicos', () => {
    const reflector = { getAllAndOverride: jest.fn(() => undefined) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(buildContext({ role: UserRole.CUSTOMER }))).toBe(true);
  });

  it('permite el acceso si el rol del usuario está entre los requeridos', () => {
    const reflector = { getAllAndOverride: jest.fn(() => [UserRole.ADMIN]) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(buildContext({ role: UserRole.ADMIN }))).toBe(true);
  });

  it('rechaza el acceso si el rol del usuario no está entre los requeridos', () => {
    const reflector = { getAllAndOverride: jest.fn(() => [UserRole.ADMIN]) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(buildContext({ role: UserRole.PROVIDER }))).toThrow(ForbiddenException);
  });

  it('rechaza el acceso si no hay usuario autenticado en el request', () => {
    const reflector = { getAllAndOverride: jest.fn(() => [UserRole.ADMIN]) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(buildContext(undefined))).toThrow(ForbiddenException);
  });
});
