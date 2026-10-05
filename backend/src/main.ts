import 'reflect-metadata';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { SentryExceptionsFilter } from './common/filters/sentry-exceptions.filter';

/**
 * Sin SENTRY_DSN configurado, esto no hace nada — no rompe el arranque local.
 * Se inicializa ANTES de crear la app de Nest para capturar también errores
 * de arranque (ej. fallas de conexión a la base de datos).
 */
function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1, // 10% de las requests, suficiente para un MVP sin gastar cuota de más
  });
}

const INSECURE_DEFAULT_JWT_SECRET = 'dev-secret-change-me';
const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Corta el arranque en producción si alguien olvidó configurar un JWT_SECRET real.
 * Un secret débil o el placeholder por defecto permitiría falsificar tokens de
 * cualquier usuario (incluido ADMIN) — esto NUNCA debe llegar a producción.
 */
function assertSecureJwtSecretInProduction(config: ConfigService): void {
  if (config.get<string>('nodeEnv') !== 'production') return;

  const secret = config.get<string>('jwt.secret') ?? '';
  if (!secret || secret === INSECURE_DEFAULT_JWT_SECRET || secret.length < MIN_JWT_SECRET_LENGTH) {
    // eslint-disable-next-line no-console
    console.error(
      '\n🚨 JWT_SECRET inseguro o no configurado en producción.\n' +
        `   Genera uno real con: openssl rand -base64 48\n` +
        `   y configúralo como variable de entorno JWT_SECRET (mínimo ${MIN_JWT_SECRET_LENGTH} caracteres).\n`,
    );
    process.exit(1);
  }
}

async function bootstrap() {
  initSentry();

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  assertSecureJwtSecretInProduction(config);

  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('corsOrigin'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Respeta @Exclude() de class-transformer (ej. User.passwordHash) en TODAS las respuestas
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryExceptionsFilter(httpAdapter));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('EstaEsLaMía.cl API')
    .setDescription('API de generación de leads para empresas y profesionales de servicios')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('port') || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`EstaEsLaMía API corriendo en http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Swagger docs en http://localhost:${port}/api/docs`);
}

bootstrap();
