import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commune } from './entities/commune.entity';
import { CommunesService } from './communes.service';
import { CommunesController } from './communes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Commune])],
  controllers: [CommunesController],
  providers: [CommunesService],
  exports: [TypeOrmModule, CommunesService],
})
export class CommunesModule {}
