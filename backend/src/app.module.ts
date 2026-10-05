import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ServicesModule } from './modules/services/services.module';
import { RegionsModule } from './modules/regions/regions.module';
import { CommunesModule } from './modules/communes/communes.module';
import { ServiceRequestsModule } from './modules/service-requests/service-requests.module';
import { LeadsModule } from './modules/leads/leads.module';
import { SitemapModule } from './modules/sitemap/sitemap.module';
import { StatsModule } from './modules/stats/stats.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: (config.get<number>('throttle.ttl') ?? 60) * 1000,
          limit: config.get<number>('throttle.limit') ?? 100,
        },
      ],
    }),
    DatabaseModule,
    CommonModule,

    // Módulos de dominio
    UsersModule,
    AuthModule,
    ProvidersModule,
    CategoriesModule,
    ServicesModule,
    RegionsModule,
    CommunesModule,
    ServiceRequestsModule,
    LeadsModule,
    SitemapModule,
    StatsModule,
    AnalyticsModule,
  ],
  providers: [
    // Aplica rate limiting a TODA la API por defecto (100 req/min/IP);
    // los endpoints sensibles (auth, registro, creación de solicitudes)
    // tienen límites más estrictos vía @Throttle() en su propio controller.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
