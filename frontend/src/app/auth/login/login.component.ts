import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>Iniciar sesión</h1>
        <p class="subtitle">Para clientes, empresas y administradores.</p>

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
      }
      .full {
        width: 100%;
      }
      .subtitle {
        color: #757575;
        margin-bottom: 1.5rem;
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
}
