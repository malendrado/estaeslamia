import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verifica tokens de Cloudflare Turnstile en los endpoints públicos sensibles
 * (crear ServiceRequest, registro de customer, registro de provider) para
 * frenar spam/bots que el rate limiting por IP por sí solo no filtra.
 *
 * En desarrollo (sin TURNSTILE_SECRET_KEY configurado) la verificación se
 * omite automáticamente para no bloquear el flujo local — se loguea una
 * advertencia una sola vez para que no pase desapercibido.
 */
@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private warnedMissingSecret = false;

  constructor(private readonly config: ConfigService) {}

  async verify(token: string | undefined, remoteIp?: string): Promise<void> {
    const secretKey = this.config.get<string>('turnstile.secretKey');

    if (!secretKey) {
      if (!this.warnedMissingSecret) {
        this.logger.warn(
          'TURNSTILE_SECRET_KEY no configurado: la verificación de Turnstile está DESACTIVADA. ' +
            'Esto es aceptable en desarrollo, pero nunca debe llegar a producción.',
        );
        this.warnedMissingSecret = true;
      }
      return;
    }

    if (!token) {
      throw new BadRequestException('Verificación de seguridad (Turnstile) faltante');
    }

    const body = new URLSearchParams();
    body.set('secret', secretKey);
    body.set('response', token);
    if (remoteIp) body.set('remoteip', remoteIp);

    let result: TurnstileVerifyResponse;
    try {
      const response = await fetch(VERIFY_URL, { method: 'POST', body });
      result = (await response.json()) as TurnstileVerifyResponse;
    } catch (error) {
      this.logger.error('Error llamando a la API de Turnstile', error as Error);
      throw new BadRequestException('No pudimos verificar la seguridad del formulario. Intenta nuevamente.');
    }

    if (!result.success) {
      this.logger.warn(`Turnstile rechazó un token: ${(result['error-codes'] ?? []).join(', ')}`);
      throw new BadRequestException('Verificación de seguridad fallida. Recarga la página e intenta nuevamente.');
    }
  }
}
