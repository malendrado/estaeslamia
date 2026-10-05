import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { LeadStatus, UserRole } from '../../common/enums';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiQuery({ name: 'status', required: false, enum: LeadStatus })
  @ApiOperation({ summary: '[PROVIDER] Mis leads, opcionalmente filtrados por estado' })
  findMine(@CurrentUser() currentUser: AuthenticatedUser, @Query('status') status?: LeadStatus) {
    return this.leadsService.findMineForProvider(currentUser.userId, status);
  }

  @Get('mine/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROVIDER] Detalle de un lead propio (marca VIEWED automáticamente si estaba DELIVERED)' })
  findOneMine(@CurrentUser() currentUser: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.findOneForProvider(currentUser.userId, id);
  }

  @Patch('mine/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROVIDER] Cambiar el estado de un lead propio (ej. marcar como CONTACTED)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 403, description: 'Transición no permitida, o el lead no pertenece a tu empresa' })
  @ApiResponse({ status: 404, description: 'Lead no encontrado' })
  updateStatus(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leadsService.updateStatusForProvider(currentUser.userId, id, dto.status);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiQuery({ name: 'status', required: false, enum: LeadStatus })
  @ApiQuery({ name: 'providerId', required: false })
  @ApiOperation({ summary: '[ADMIN] Listado paginado de leads, filtrable por estado y provider' })
  findAllForAdmin(
    @Query() pagination: PaginationQueryDto,
    @Query('status') status?: LeadStatus,
    @Query('providerId') providerId?: string,
  ) {
    return this.leadsService.findAllForAdmin({ status, providerId, page: pagination.page, limit: pagination.limit });
  }

  @Get('by-service-request/:serviceRequestId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Leads generados para una ServiceRequest específica' })
  findByServiceRequest(@Param('serviceRequestId', ParseUUIDPipe) serviceRequestId: string) {
    return this.leadsService.findByServiceRequestId(serviceRequestId);
  }
}
