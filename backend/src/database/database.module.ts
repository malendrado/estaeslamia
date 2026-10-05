import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        autoLoadEntities: true,
        // Nunca true en ningún ambiente: el schema se controla 100% vía migraciones.
        synchronize: false,
        migrationsRun: false,
        // Supabase/Neon exigen SSL. DB_SSL=true lo activa (ver .env.example) —
        // separado de NODE_ENV porque el Postgres local de Docker no lo necesita
        // ni en "production" si alguna vez se prueba ese modo localmente.
        ssl: config.get<string>('database.ssl') === 'true' ? { rejectUnauthorized: false } : false,
        logging: config.get<string>('nodeEnv') === 'development' ? ['error', 'warn'] : ['error'],
      }),
    }),
  ],
})
export class DatabaseModule {}
