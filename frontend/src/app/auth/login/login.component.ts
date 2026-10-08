import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { GoogleSignInComponent } from '../../shared/components/google-signin/google-signin.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    GoogleSignInComponent,
  ],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>Iniciar sesión</h1>
        <p class="subtitle">Para clientes, empresas y administradores.</p>

        @if (googleEnabled) {
          <app-google-signin (signedIn)="onGoogleSignIn($event)"></app-google-signin>

          @if (!showEmailLogin()) {
            <p class="divider-link">
              <button type="button" class="link-button" (click)="showEmailLogin.set(true)">
                o ingresa con tu email y contraseña
              </button>
            </p>
          }
        }

        @if (showEmailLogin() || !googleEnabled) {
          @if (googleEnabled) {
            <p class="divider"><span>o ingresa con tu email y contraseña</span></p>
          }

          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>Contraseña</mat-label>
              <input matInput type="password" formControlName="password" />
            </mat-form-field>

            @if (errorMessage()) {
              <p class="error">{{ errorMessage() }}</p>
            }

            <button mat-flat-button color="primary" class="full" type="submit" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Ingresando...' : 'Ingresar' }}
            </button>
          </form>
        } @else if (errorMessage()) {
          <p class="error">{{ errorMessage() }}</p>
        }

        <p class="links">
          ¿No tienes cuenta? <a routerLink="/registro">Regístrate como cliente</a><br />
          ¿Eres empresa? <a routerLink="/proveedores/registro">Regístrate como proveedor</a>
        </p>
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
        max-width: 420px;
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
      .divider-link {
        text-align: center;
        margin: 1rem 0;
      }
      .link-button {
        background: none;
        border: none;
        padding: 0;
        font-size: 0.85rem;
        color: var(--eslm-primary, #00796b);
        text-decoration: underline;
        cursor: pointer;
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
export class LoginComponent {
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly googleEnabled = !!environment.googleClientId;
  readonly showEmailLogin = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();
    this.authService.login(email!, password!).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.router.navigateByUrl(this.authService.homeRouteForRole(result.user.role));
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'No pudimos iniciar sesión. Revisa tus credenciales.');
      },
    });
  }

  onGoogleSignIn(idToken: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.authService.loginWithGoogle(idToken).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.router.navigateByUrl(this.authService.homeRouteForRole(result.user.role));
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'No pudimos iniciar sesión con Google.');
      },
    });
  }
}
