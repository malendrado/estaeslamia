import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

// Endpoints donde un 401 significa "credenciales inválidas", no "tu sesión expiró"
// — ahí el propio formulario ya muestra el error, no hay que forzar un logout.
const AUTH_ENDPOINTS_EXEMPT_FROM_AUTO_LOGOUT = ['/auth/login', '/auth/register', '/auth/google'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (token && req.url.startsWith(environment.apiUrl)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      const isExempt = AUTH_ENDPOINTS_EXEMPT_FROM_AUTO_LOGOUT.some((path) => req.url.includes(path));
      if (token && !isExempt && error instanceof HttpErrorResponse && error.status === 401) {
        // El token expiró o quedó inválido (ej. JWT_EXPIRES_IN vencido) — limpiar la
        // sesión y mandar a login, en vez de dejar cada pantalla mostrando "no carga".
        authService.clearSession();
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};
