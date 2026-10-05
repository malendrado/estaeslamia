import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Provider } from './entities/provider.entity';
import { ProviderService as ProviderServiceEntity } from './entities/provider-service.entity';
import { ProviderCommune } from './entities/provider-commune.entity';
import { Service } from '../services/entities/service.entity';
import { Commune } from '../communes/entities/commune.entity';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider, ProviderServiceEntity, ProviderCommune, Service, Commune]),
    UsersModule,
    AuthModule,
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [TypeOrmModule, ProvidersService],
})
export class ProvidersModule {}
