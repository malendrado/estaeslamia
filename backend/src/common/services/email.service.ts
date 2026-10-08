import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ServiceRequest } from '../../modules/service-requests/entities/service-request.entity';
import { Provider } from '../../modules/providers/entities/provider.entity';

const BRAND_COLOR = '#0e8388';
const INK_COLOR = '#16213e';

/**
 * Envía las notificaciones por email del flujo de leads. Sin RESEND_API_KEY
 * configurada, cada método omite el envío y loguea una advertencia — igual
 * que TurnstileService/GoogleAuthService, para no bloquear el flujo local.
 * Los errores de envío nunca se propagan: un email que falla no debe tirar
 * abajo la creación de una solicitud o un lead.
 *
 * El "logo" es texto estilizado, no una imagen: la app corre en localhost en
 * desarrollo, así que no hay una URL pública que un cliente de correo pueda
 * cargar. Cuando haya un dominio real, agregar un <img> en el header es un
 * cambio de una línea en `header()`.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private client: Resend | null = null;
  private warnedMissingKey = false;

  constructor(private readonly config: ConfigService) {}

  private getClient(): Resend | null {
    const apiKey = this.config.get<string>('email.resendApiKey');
    if (!apiKey) {
      if (!this.warnedMissingKey) {
        this.logger.warn(
          'RESEND_API_KEY no configurado: el envío de emails está DESACTIVADO. ' +
            'Esto es aceptable en desarrollo, pero nunca debe llegar a producción.',
        );
        this.warnedMissingKey = true;
      }
      return null;
    }
    if (!this.client) {
      this.client = new Resend(apiKey);
    }
    return this.client;
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    try {
      await client.emails.send({
        from: this.config.get<string>('email.from')!,
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(`Error enviando email a ${to}: "${subject}"`, error as Error);
    }
  }

  private frontendUrl(path: string): string {
    return `${this.config.get<string>('corsOrigin')}${path}`;
  }

  private header(): string {
    return `
      <div style="background: ${BRAND_COLOR}; padding: 20px 32px; border-radius: 16px 16px 0 0;">
        <span style="font-family: Georgia, serif; font-size: 1.3rem; font-weight: 700; color: #fff; letter-spacing: 0.02em;">
          EstaEsLaMía<span style="color: #ffd6c9;">.cl</span>
        </span>
      </div>
    `;
  }

  private detailRow(label: string, value: string | null | undefined): string {
    if (!value) return '';
    return `
      <tr>
        <td style="padding: 4px 0; color: #757575; font-size: 0.82rem; vertical-align: top; white-space: nowrap;">${label}</td>
        <td style="padding: 4px 0 4px 12px; color: ${INK_COLOR}; font-size: 0.9rem;">${value}</td>
      </tr>
    `;
  }

  private requestDetailsBox(serviceRequest: ServiceRequest): string {
    const budget =
      serviceRequest.budgetMin || serviceRequest.budgetMax
        ? `$${Number(serviceRequest.budgetMin ?? 0).toLocaleString('es-CL')} - $${Number(serviceRequest.budgetMax ?? 0).toLocaleString('es-CL')}`
        : null;
    const preferredDate = serviceRequest.preferredDate
      ? new Date(serviceRequest.preferredDate).toLocaleDateString('es-CL')
      : null;

    return `
      <table style="width: 100%; background: #f6f8f8; border-radius: 10px; padding: 14px 16px; margin: 1rem 0; border-collapse: collapse;">
        <tr><td colspan="2" style="padding: 0 0 8px;">
          ${this.detailRow('Servicio', serviceRequest.service?.name)}
          ${this.detailRow('Comuna', serviceRequest.commune?.name)}
          ${this.detailRow('Presupuesto', budget)}
          ${this.detailRow('Fecha deseada', preferredDate)}
        </td></tr>
      </table>
      <p style="color: #444; font-size: 0.9rem; line-height: 1.5; margin: 0 0 0.5rem;">${serviceRequest.description}</p>
    `;
  }

  private layout(title: string, bodyHtml: string, ctaUrl: string, ctaLabel: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        ${this.header()}
        <div style="background: #fff; border: 1px solid #eee; border-top: none; border-radius: 0 0 16px 16px; padding: 28px 32px; color: ${INK_COLOR};">
          <h2 style="color: ${INK_COLOR}; margin: 0 0 0.75rem; font-size: 1.25rem;">${title}</h2>
          ${bodyHtml}
          <a href="${ctaUrl}" style="display: inline-block; margin-top: 1.5rem; padding: 12px 28px; background: ${BRAND_COLOR}; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.9rem;">
            ${ctaLabel}
          </a>
        </div>
        <p style="margin-top: 1.5rem; font-size: 0.78rem; color: #aaa; text-align: center;">EstaEsLaMía.cl — Encuentra a quien puede ayudarte</p>
      </div>
    `;
  }

  /** Al crear la solicitud, si el matching encontró empresas de inmediato. */
  async sendLeadMatchedToCustomer(serviceRequest: ServiceRequest, matchesCount: number): Promise<void> {
    const plural = matchesCount === 1 ? 'empresa' : 'empresas';
    await this.send(
      serviceRequest.contactEmail,
      `Encontramos ${matchesCount} ${plural} para tu solicitud`,
      this.layout(
        '¡Buenas noticias!',
        `<p style="margin: 0 0 0.5rem;">Encontramos <strong>${matchesCount} ${plural}</strong> que pueden ayudarte. Pronto se pondrán en contacto contigo.</p>
         ${this.requestDetailsBox(serviceRequest)}`,
        this.frontendUrl(`/solicitud/${serviceRequest.id}`),
        'Ver mi solicitud',
      ),
    );
  }

  /** Cuando una empresa nueva se suma después (retry de matching), no en la creación original. */
  async sendNewProviderMatchToCustomer(serviceRequest: ServiceRequest, provider: Provider): Promise<void> {
    await this.send(
      serviceRequest.contactEmail,
      `Una nueva empresa puede ayudarte con tu solicitud`,
      this.layout(
        'Nueva empresa disponible',
        `<p style="margin: 0 0 0.5rem;"><strong>${provider.businessName}</strong> puede ayudarte con tu solicitud. Pronto se pondrán en contacto contigo.</p>
         ${this.requestDetailsBox(serviceRequest)}`,
        this.frontendUrl(`/solicitud/${serviceRequest.id}`),
        'Ver mi solicitud',
      ),
    );
  }

  /** Al cliente, cuando la empresa marca el lead como CONTACTED. */
  async sendLeadContactedToCustomer(serviceRequest: ServiceRequest, provider: Provider): Promise<void> {
    await this.send(
      serviceRequest.contactEmail,
      `${provider.businessName} te contactó por tu solicitud`,
      this.layout(
        '¡Te están contactando!',
        `<p style="margin: 0 0 0.5rem;"><strong>${provider.businessName}</strong> marcó tu solicitud como contactada. Revisa tu teléfono o WhatsApp — deberían comunicarse contigo pronto, si no lo han hecho ya.</p>
         ${this.requestDetailsBox(serviceRequest)}`,
        this.frontendUrl(`/solicitud/${serviceRequest.id}`),
        'Ver mi solicitud',
      ),
    );
  }

  /** Al cliente, cuando la empresa que lo había aceptado/contactado deja de estar disponible (suspendida). */
  async sendProviderUnavailableToCustomer(serviceRequest: ServiceRequest, provider: Provider): Promise<void> {
    await this.send(
      serviceRequest.contactEmail,
      `${provider.businessName} ya no está disponible para tu solicitud`,
      this.layout(
        'Cambio en tu solicitud',
        `<p style="margin: 0 0 0.5rem;"><strong>${provider.businessName}</strong> ya no está disponible en la plataforma, así que no podrá continuar con tu solicitud. Seguimos buscando otras empresas que puedan ayudarte.</p>
         ${this.requestDetailsBox(serviceRequest)}`,
        this.frontendUrl(`/solicitud/${serviceRequest.id}`),
        'Ver mi solicitud',
      ),
    );
  }

  /** A la empresa, cada vez que recibe un lead nuevo (creación o retry de matching). */
  async sendNewLeadToProvider(provider: Provider, serviceRequest: ServiceRequest): Promise<void> {
    await this.send(
      provider.email,
      'Tienes un nuevo lead en EstaEsLaMía.cl',
      this.layout(
        'Nuevo lead recibido',
        `<p style="margin: 0 0 0.5rem;">Un cliente necesita este servicio. Revisa el detalle y contáctalo pronto.</p>
         ${this.requestDetailsBox(serviceRequest)}`,
        this.frontendUrl('/proveedor'),
        'Ver mis leads',
      ),
    );
  }

  /** Cuando un admin aprueba a la empresa (PENDING -> ACTIVE). */
  async sendProviderApproved(provider: Provider): Promise<void> {
    await this.send(
      provider.email,
      '¡Tu empresa fue aprobada en EstaEsLaMía.cl!',
      this.layout(
        '¡Felicidades!',
        `<p>Tu empresa <strong>${provider.businessName}</strong> fue aprobada y ya puede recibir leads.</p>`,
        this.frontendUrl('/proveedor'),
        'Ir a mi panel',
      ),
    );
  }
}
