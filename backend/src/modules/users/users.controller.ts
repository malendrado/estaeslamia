import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/**
 * Gestión de usuarios para el panel de Admin (brief original, secciones 4 y 20:
 * "gestionar usuarios" era una capacidad explícita que nunca se había construido).
 */
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiOperation({ summary: '[ADMIN] Listado paginado de usuarios, filtrable por rol y estado' })
  findAll(
    @Query() pagination: PaginationQueryDto,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
  ) {
    return this.usersService.findAllForAdmin({
      role,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      page: pagination.page,
      limit: pagination.limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '[ADMIN] Detalle de un usuario' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findByIdForAdmin(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '[ADMIN] Activar o suspender una cuenta' })
  @ApiResponse({ status: 400, description: 'No se puede activar una cuenta "silenciosa" sin contraseña' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.setActiveStatus(id, dto.isActive);
  }
}
