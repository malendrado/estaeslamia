import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResult, User, UserRole } from '../models/models';

const TOKEN_KEY = 'eslm_token';
const USER_KEY = 'eslm_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<AuthResult['user'] | null>(this.readStoredUser());

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isLoggedIn = computed(() => !!this.currentUserSignal());
  readonly role = computed(() => this.currentUserSignal()?.role ?? null);

  private readonly router = inject(Router);

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResult> {
    return this.http
      .post<AuthResult>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((result) => this.persistSession(result)));
  }

  /** Perfil completo del usuario autenticado (incluye `phone`, que no viene en la sesión liviana). */
  getMe(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`);
  }

  registerCustomer(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    turnstileToken?: string;
  }): Observable<AuthResult> {
    return this.http
      .post<AuthResult>(`${environment.apiUrl}/auth/register`, data)
      .pipe(tap((result) => this.persistSession(result)));
  }

  registerProvider(data: {
    email: string;
    password: string;
    contactName: string;
    businessName: string;
    phone: string;
    description?: string;
    website?: string;
    whatsapp?: string;
    turnstileToken?: string;
  }): Observable<AuthResult> {
    return this.http
      .post<AuthResult>(`${environment.apiUrl}/providers/register`, data)
      .pipe(tap((result) => this.persistSession(result)));
  }

  loginWithGoogle(idToken: string): Observable<AuthResult> {
    return this.http
      .post<AuthResult>(`${environment.apiUrl}/auth/google`, { idToken })
      .pipe(tap((result) => this.persistSession(result)));
  }

  registerProviderWithGoogle(data: {
    idToken: string;
    businessName: string;
    phone: string;
    description?: string;
    website?: string;
    whatsapp?: string;
  }): Observable<AuthResult> {
    return this.http
      .post<AuthResult>(`${environment.apiUrl}/providers/register-google`, data)
      .pipe(tap((result) => this.persistSession(result)));
  }

  logout(): void {
    this.clearSession();
    this.router.navigateByUrl('/');
  }

  /** Borra el token/usuario guardados sin redirigir — para cuando el redirect lo decide el caller (ej. el interceptor en un 401). */
  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasRole(...roles: UserRole[]): boolean {
    const currentRole = this.role();
    return !!currentRole && roles.includes(currentRole);
  }

  /** Redirige según el rol tras login/registro exitoso */
  homeRouteForRole(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return '/admin';
      case UserRole.PROVIDER:
        return '/proveedor';
      default:
        return '/mis-solicitudes';
    }
  }

  private persistSession(result: AuthResult): void {
    localStorage.setItem(TOKEN_KEY, result.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    this.currentUserSignal.set(result.user);
  }

  private readStoredUser(): AuthResult['user'] | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User & AuthResult['user'];
    } catch {
      return null;
    }
  }
}
