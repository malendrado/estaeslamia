export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  // Clave pública de Cloudflare Turnstile (no es secreta, se expone en el HTML).
  // Vacía en desarrollo: el widget simplemente no se renderiza y el backend
  // omite la verificación si TURNSTILE_SECRET_KEY tampoco está configurado.
  turnstileSiteKey: '',
  // Sin configurar: Sentry no se inicializa en el frontend. Gratis en https://sentry.io/
  sentryDsn: '',
};
