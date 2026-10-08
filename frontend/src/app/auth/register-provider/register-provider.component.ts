import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { TurnstileComponent } from '../../shared/components/turnstile/turnstile.component';
import { GoogleSignInComponent } from '../../shared/components/google-signin/google-signin.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register-provider',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TurnstileComponent,
    GoogleSignInComponent,
  ],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>Registra tu empresa</h1>
        <p class="subtitle">
          Tu cuenta quedará <strong>pendiente de aprobación</strong>. Un administrador la revisará antes de que
          empieces a recibir leads.
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Nombre de la empresa</mat-label>
            <input matInput formControlName="businessName" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Teléfono</mat-label>
            <input matInput formControlName="phone" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Descripción breve (opcional)</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
          </mat-form-field>

          @if (googleEnabled) {
            <app-google-signin (signedIn)="onGoogleSignIn($event)"></app-google-signin>
            <p class="google-hint">Usa el email de tu cuenta de Google para la empresa, sin crear contraseña.</p>
            <p class="divider"><span>o con email y contraseña</span></p>
          }

          <mat-form-field appearance="outline" class="full">
            <mat-label>Nombre de contacto</mat-label>
            <input matInput formControlName="contactName" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Contraseña</mat-label>
            <input matInput type="password" formControlName="password" />
          </mat-form-field>

          <app-turnstile (verified)="turnstileToken = $event" (expired)="turnstileToken = ''"></app-turnstile>

          @if (errorMessage()) {
            <p class="error">{{ errorMessage() }}</p>
          }

          <p class="legal-note">
            Al registrar tu empresa, aceptas nuestros
            <a routerLink="/terminos" target="_blank">Términos y Condiciones</a> y nuestra
            <a routerLink="/privacidad" target="_blank">Política de Privacidad</a>.
          </p>

          <button
            mat-flat-button
            color="primary"
            class="full"
            type="submit"
            [disabled]="form.invalid || loading() || (turnstileRequired && !turnstileToken)"
          >
            {{ loading() ? 'Registrando...' : 'Registrar empresa' }}
          </button>
        </form>

        <p class="links">¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a></p>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-page {
        display: flex;
        justify-content: center;
        padding: 3rem 1rem;
      }
      .auth-card {
        width: 100%;
        max-width: 460px;
        background: #fff;
        border: 1px solid #eee;
        border-radius: 16px;
        box-shadow: 0 16px 32px -20px rgba(22, 33, 62, 0.15);
        padding: 1.75rem;
      }
      .full {
        width: 100%;
      }
      .subtitle {
        color: #757575;
        margin-bottom: 1.5rem;
      }
      .google-hint {
        font-size: 0.78rem;
        color: #757575;
        margin: 0.4rem 0 0;
      }
      .divider {
        display: flex;
        align-items: center;
        text-align: center;
        color: #9e9e9e;
        font-size: 0.85rem;
        margin: 1rem 0;
      }
      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid #e0e0e0;
      }
      .divider span {
        padding: 0 0.75rem;
      }
      .legal-note {
        font-size: 0.78rem;
        color: #757575;
        margin: 0.25rem 0 0.75rem;
      }
      .legal-note a {
        color: var(--eslm-primary);
      }
      .error {
        color: #c62828;
        font-size: 0.85rem;
      }
      .links {
        margin-top: 1.5rem;
        font-size: 0.9rem;
        text-align: center;
        color: #555;
      }
    `,
  ],
})
export class RegisterProviderComponent {
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  turnstileToken = '';
  readonly turnstileRequired = !!environment.turnstileSiteKey;
  readonly googleEnabled = !!environment.googleClientId;

  readonly form = this.fb.group({
    businessName: ['', [Validators.required, Validators.minLength(2)]],
    contactName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    description: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor(
    private readonly authService: AuthService,
    private readonly analyticsService: AnalyticsService,
    private readonly router: Router,
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    const payload = { ...this.form.getRawValue(), turnstileToken: this.turnstileToken };
    this.authService.registerProvider(payload as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.analyticsService.track('PROVIDER_REGISTERED', '/proveedores/registro');
        this.router.navigateByUrl('/proveedor');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'No pudimos registrar tu empresa.');
      },
    });
  }

  onGoogleSignIn(idToken: string): void {
    const businessName = this.form.get('businessName');
    const phone = this.form.get('phone');
    if (businessName?.invalid || phone?.invalid) {
      businessName?.markAsTouched();
      phone?.markAsTouched();
      this.errorMessage.set('Completa el nombre de la empresa y el teléfono antes de continuar con Google.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { businessName: name, phone: phoneValue, description } = this.form.getRawValue();
    this.authService
      .registerProviderWithGoogle({
        idToken,
        businessName: name!,
        phone: phoneValue!,
        description: description || undefined,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.analyticsService.track('PROVIDER_REGISTERED', '/proveedores/registro');
          this.router.navigateByUrl('/proveedor');
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err?.error?.message ?? 'No pudimos registrar tu empresa con Google.');
        },
      });
  }
}
