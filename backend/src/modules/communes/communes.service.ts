import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commune } from './entities/commune.entity';

@Injectable()
export class CommunesService {
  constructor(
    @InjectRepository(Commune)
    private readonly communeRepository: Repository<Commune>,
  ) {}

  findAll(regionId?: string): Promise<Commune[]> {
    return this.communeRepository.find({
      where: regionId ? { regionId } : {},
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Commune> {
    const commune = await this.communeRepository.findOne({ where: { id } });
    if (!commune) throw new NotFoundException('Comuna no encontrada');
    return commune;
  }
}
