export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'estaeslamia',
    password: process.env.DB_PASSWORD || 'estaeslamia',
    name: process.env.DB_NAME || 'estaeslamia',
    ssl: process.env.DB_SSL || 'false',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  supabaseStorage: {
    // Sin configurar: el endpoint de subida de logo devuelve un error claro en vez de fallar en silencio.
    url: process.env.SUPABASE_URL || null,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || null,
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'provider-logos',
  },
  sentry: {
    // Sin configurar: Sentry simplemente no se inicializa, sin romper nada.
    dsn: process.env.SENTRY_DSN || null,
  },
  turnstile: {
    // Sin configurar en desarrollo: TurnstileService omite la verificación y loguea advertencia.
    secretKey: process.env.TURNSTILE_SECRET_KEY || null,
  },
  google: {
    // Sin configurar: POST /auth/google y /providers/register-google devuelven error claro.
    clientId: process.env.GOOGLE_CLIENT_ID || null,
  },
  email: {
    // Sin configurar: EmailService omite el envío y loguea una advertencia (no rompe el flujo).
    resendApiKey: process.env.RESEND_API_KEY || null,
    from: process.env.EMAIL_FROM || 'EstaEsLaMía.cl <onboarding@resend.dev>',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
});
