import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { slugify } from '../../database/seeds/utils/slugify';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  findAllActive(): Promise<Category[]> {
    return this.categoryRepository.find({ where: { isActive: true }, order: { order: 'ASC' } });
  }

  findAllForAdmin(): Promise<Category[]> {
    return this.categoryRepository.find({ order: { order: 'ASC' } });
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { slug } });
    if (!category) throw new NotFoundException(`Categoría con slug "${slug}" no encontrada`);
    return category;
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = slugify(dto.name);
    const existing = await this.categoryRepository.findOne({ where: { slug } });
    if (existing) throw new ConflictException(`Ya existe una categoría con slug "${slug}"`);

    const category = this.categoryRepository.create({ ...dto, slug });
    return this.categoryRepository.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);
    Object.assign(category, dto);
    if (dto.name) {
      category.slug = slugify(dto.name);
    }
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findById(id);
    // Soft-delete conceptual: se desactiva en vez de borrar para no romper integridad
    // referencial con Service/ServiceRequest existentes.
    category.isActive = false;
    await this.categoryRepository.save(category);
  }
}
