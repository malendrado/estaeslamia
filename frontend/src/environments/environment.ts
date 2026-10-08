export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  // Clave pública de Cloudflare Turnstile (no es secreta, se expone en el HTML).
  // Vacía en desarrollo: el widget simplemente no se renderiza y el backend
  // omite la verificación si TURNSTILE_SECRET_KEY tampoco está configurado.
  turnstileSiteKey: '',
  // Client ID de Google Identity Services (no es secreto, se expone en el HTML).
  // Vacío en desarrollo: el botón de Google simplemente no se renderiza.
  googleClientId: '566958985814-k6ov1bdiaev9jkb0d1o2l4vrmncbrmu7.apps.googleusercontent.com',
  // Sin configurar: Sentry no se inicializa en el frontend. Gratis en https://sentry.io/
  sentryDsn: '',
};
