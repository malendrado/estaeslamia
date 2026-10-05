import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { slugify } from '../../database/seeds/utils/slugify';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  findAllActive(categoryId?: string): Promise<Service[]> {
    return this.serviceRepository.find({
      where: { isActive: true, ...(categoryId ? { categoryId } : {}) },
      order: { name: 'ASC' },
    });
  }

  findAllForAdmin(): Promise<Service[]> {
    return this.serviceRepository.find({ order: { name: 'ASC' } });
  }

  async findBySlug(slug: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { slug } });
    if (!service) throw new NotFoundException(`Servicio con slug "${slug}" no encontrado`);
    return service;
  }

  async findById(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return service;
  }

  async create(dto: CreateServiceDto): Promise<Service> {
    const slug = slugify(dto.name);
    const existing = await this.serviceRepository.findOne({ where: { slug } });
    if (existing) throw new ConflictException(`Ya existe un servicio con slug "${slug}"`);

    const service = this.serviceRepository.create({ ...dto, slug });
    return this.serviceRepository.save(service);
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findById(id);
    Object.assign(service, dto);
    if (dto.name) {
      service.slug = slugify(dto.name);
    }
    return this.serviceRepository.save(service);
  }

  async remove(id: string): Promise<void> {
    const service = await this.findById(id);
    service.isActive = false;
    await this.serviceRepository.save(service);
  }
}
