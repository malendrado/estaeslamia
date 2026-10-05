import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { environment } from '../../../../environments/environment';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

/**
 * Widget de Cloudflare Turnstile (anti-bot). En desarrollo, si no hay
 * `environment.turnstileSiteKey` configurada, no renderiza nada y emite un
 * token vacío de inmediato — el backend omite la verificación en ese caso
 * (ver TurnstileService), así el flujo local no se bloquea.
 *
 * Uso: <app-turnstile (verified)="token = $event"></app-turnstile>
 * y luego se envía `token` como `turnstileToken` en el payload del form.
 */
@Component({
  selector: 'app-turnstile',
  standalone: true,
  template: `<div #container></div>`,
})
export class TurnstileComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @Output() verified = new EventEmitter<string>();
  @Output() expired = new EventEmitter<void>();

  private widgetId: string | undefined;
  private pollInterval: ReturnType<typeof setInterval> | undefined;

  ngAfterViewInit(): void {
    if (!environment.turnstileSiteKey) {
      // Desarrollo sin Turnstile configurado: no bloquear el formulario.
      this.verified.emit('');
      return;
    }

    this.pollInterval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(this.pollInterval);
        this.widgetId = window.turnstile.render(this.containerRef.nativeElement, {
          sitekey: environment.turnstileSiteKey,
          callback: (token) => this.verified.emit(token),
          'expired-callback': () => this.expired.emit(),
          'error-callback': () => this.expired.emit(),
          theme: 'light',
        });
      }
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.widgetId && window.turnstile) window.turnstile.remove(this.widgetId);
  }
}
