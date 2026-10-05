import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * DataSource usado exclusivamente por la CLI de TypeORM (migration:generate/run/revert).
 * La app en runtime usa TypeOrmModule.forRootAsync (ver database.module.ts / app.module.ts).
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'estaeslamia',
  password: process.env.DB_PASSWORD || 'estaeslamia',
  database: process.env.DB_NAME || 'estaeslamia',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  logging: false,
});
