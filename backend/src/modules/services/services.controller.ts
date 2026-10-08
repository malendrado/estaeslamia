import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiOperation({ summary: 'Listado público de servicios activos, opcionalmente filtrado por categoría' })
  @ApiResponse({ status: 200, description: 'Listado de servicios activos' })
  findAllPublic(@Query('categoryId') categoryId?: string) {
    return this.servicesService.findAllActive(categoryId);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Listado completo, incluyendo inactivos' })
  @ApiResponse({ status: 200, description: 'Listado completo de servicios' })
  @ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Rol insuficiente (requiere ADMIN)' })
  findAllForAdmin() {
    return this.servicesService.findAllForAdmin();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detalle público de un servicio por slug' })
  @ApiResponse({ status: 200, description: 'Servicio encontrado' })
  @ApiResponse({ status: 404, description: 'No existe un servicio con ese slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.servicesService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Crear servicio' })
  @ApiResponse({ status: 201, description: 'Servicio creado' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Rol insuficiente (requiere ADMIN)' })
  @ApiResponse({ status: 409, description: 'Ya existe un servicio cuyo nombre genera el mismo slug' })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Actualizar servicio' })
  @ApiResponse({ status: 200, description: 'Servicio actualizado' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Rol insuficiente (requiere ADMIN)' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Desactivar servicio (soft-delete)' })
  @ApiResponse({ status: 200, description: 'Servicio desactivado' })
  @ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Rol insuficiente (requiere ADMIN)' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.remove(id);
  }
}
