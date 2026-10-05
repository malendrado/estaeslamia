import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

/**
 * Reporta a Sentry solo lo que realmente es un bug (errores 5xx no manejados:
 * caídas de conexión, bugs de código, etc.) — nunca los 4xx esperados
 * (validación, 401, 404, etc.), para que Sentry no se llene de ruido.
 * Sin SENTRY_DSN configurado, Sentry.captureException() simplemente no hace nada.
 */
@Catch()
export class SentryExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      Sentry.captureException(exception);
    }

    super.catch(exception, host);
  }
}
