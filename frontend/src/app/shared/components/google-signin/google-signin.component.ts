import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { environment } from '../../../../environments/environment';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            container: HTMLElement,
            options: { type: string; theme: string; size: string; width?: string; text?: string },
          ) => void;
        };
      };
    };
  }
}

/**
 * Botón "Continuar con Google" (Google Identity Services). En desarrollo, si
 * no hay `environment.googleClientId` configurada, no renderiza nada — el
 * login/registro normal con email/password sigue disponible sin bloquearse.
 *
 * Uso: <app-google-signin (signedIn)="idToken = $event"></app-google-signin>
 * y luego se envía `idToken` al backend (POST /auth/google o /providers/register-google).
 */
@Component({
  selector: 'app-google-signin',
  standalone: true,
  template: `<div #container></div>`,
  styles: [
    `
      :host {
        display: flex;
        justify-content: center;
      }
    `,
  ],
})
export class GoogleSignInComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @Output() signedIn = new EventEmitter<string>();

  private pollInterval: ReturnType<typeof setInterval> | undefined;

  ngAfterViewInit(): void {
    if (!environment.googleClientId) return;

    this.pollInterval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(this.pollInterval);
        window.google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response) => this.signedIn.emit(response.credential),
        });
        window.google.accounts.id.renderButton(this.containerRef.nativeElement, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: '360',
          text: 'continue_with',
        });
      }
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }
}
