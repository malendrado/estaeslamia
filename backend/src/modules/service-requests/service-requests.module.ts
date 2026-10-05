import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequest } from './entities/service-request.entity';
import { Category } from '../categories/entities/category.entity';
import { Service } from '../services/entities/service.entity';
import { Commune } from '../communes/entities/commune.entity';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsController } from './service-requests.controller';
import { UsersModule } from '../users/users.module';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceRequest, Category, Service, Commune]),
    UsersModule,
    LeadsModule,
  ],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [TypeOrmModule, ServiceRequestsService],
})
export class ServiceRequestsModule {}
