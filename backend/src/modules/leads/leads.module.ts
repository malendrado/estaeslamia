import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { Provider } from '../providers/entities/provider.entity';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { MatchingService } from './matching.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, Provider])],
  controllers: [LeadsController],
  providers: [LeadsService, MatchingService],
  exports: [TypeOrmModule, LeadsService, MatchingService],
})
export class LeadsModule {}
