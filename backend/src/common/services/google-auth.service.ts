import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleProfile {
  email: string;
  name: string;
}

/**
 * Verifica el ID token que entrega Google Identity Services en el navegador
 * (botón "Iniciar sesión con Google"). No usamos el flujo clásico de
 * redirect/Client Secret — el frontend ya recibe un JWT firmado por Google
 * y acá solo se valida que sea legítimo y para nuestro Client ID.
 */
@Injectable()
export class GoogleAuthService {
  private client: OAuth2Client | null = null;

  constructor(private readonly config: ConfigService) {}

  private getClient(): { client: OAuth2Client; clientId: string } {
    const clientId = this.config.get<string>('google.clientId');
    if (!clientId) {
      throw new BadRequestException('El login con Google no está configurado en este ambiente');
    }
    if (!this.client) {
      this.client = new OAuth2Client(clientId);
    }
    return { client: this.client, clientId };
  }

  async verifyIdToken(idToken: string): Promise<GoogleProfile> {
    const { client, clientId } = this.getClient();

    let payload;
    try {
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Token de Google inválido o expirado');
    }

    if (!payload?.email || !payload.email_verified) {
      throw new UnauthorizedException('Tu cuenta de Google debe tener el email verificado');
    }

    return { email: payload.email, name: payload.name ?? payload.email };
  }
}
