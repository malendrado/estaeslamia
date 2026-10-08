import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listado público de categorías activas' })
  @ApiResponse({ status: 200, description: 'Listado de categorías activas, ordenadas por "order"' })
  findAllPublic() {
    return this.categoriesService.findAllActive();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Listado completo, incluyendo inactivas' })
  @ApiResponse({ status: 200, description: 'Listado completo de categorías' })
  @ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Rol insuficiente (requiere ADMIN)' })
  findAllForAdmin() {
    return this.categoriesService.findAllForAdmin();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detalle público de una categoría por slug' })
  @ApiResponse({ status: 200, description: 'Categoría encontrada' })
  @ApiResponse({ status: 404, description: 'No existe una categoría con ese slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Crear categoría' })
  @ApiResponse({ status: 201, description: 'Categoría creada' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Rol insuficiente (requiere ADMIN)' })
  @ApiResponse({ status: 409, description: 'Ya existe una categoría cuyo nombre genera el mismo slug' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Actualizar categoría' })
  @ApiResponse({ status: 200, description: 'Categoría actualizada' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Rol insuficiente (requiere ADMIN)' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Desactivar categoría (soft-delete)' })
  @ApiResponse({ status: 200, description: 'Categoría desactivada' })
  @ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Rol insuficiente (requiere ADMIN)' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
