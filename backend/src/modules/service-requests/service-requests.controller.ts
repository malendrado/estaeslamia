import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import { FindServiceRequestsQueryDto } from './dto/find-service-requests-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { UserRole } from '../../common/enums';

@ApiTags('service-requests')
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 solicitudes/min por IP: un usuario real no necesita más
  @ApiOperation({
    summary: 'Crear una solicitud de servicio (público, sin registro previo). Dispara el matching automáticamente.',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud creada y matching ejecutado. Devuelve { id, status, matchesCount } — status es MATCHED si hubo al menos un match, SUBMITTED si no.',
  })
  @ApiResponse({ status: 400, description: 'DTO inválido, consentimiento no aceptado, presupuesto inconsistente, o el servicio no pertenece a la categoría indicada' })
  @ApiResponse({ status: 429, description: 'Demasiadas solicitudes desde esta IP (límite: 10/min)' })
  async create(@Body() dto: CreateServiceRequestDto, @Req() req: Request) {
    const { serviceRequest, matchesCount } = await this.serviceRequestsService.create(dto, req.ip);
    return {
      id: serviceRequest.id,
      status: serviceRequest.status,
      matchesCount,
    };
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[CUSTOMER] Mis solicitudes' })
  findMine(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.serviceRequestsService.findAllForCustomer(currentUser.userId);
  }

  @Get('mine/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[CUSTOMER] Detalle de una solicitud propia, con las empresas encontradas' })
  findMineDetail(@CurrentUser() currentUser: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.serviceRequestsService.findDetailForCustomer(currentUser.userId, id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Resumen público y seguro de una solicitud (para la pantalla de confirmación)' })
  getPublicSummary(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceRequestsService.findPublicSummary(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Listado paginado de solicitudes, filtrable por estado/servicio/comuna' })
  findAllForAdmin(@Query() query: FindServiceRequestsQueryDto) {
    return this.serviceRequestsService.findAllForAdmin({
      status: query.status,
      serviceId: query.serviceId,
      communeId: query.communeId,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Detalle completo de una solicitud, incluyendo datos de contacto' })
  findByIdForAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceRequestsService.findByIdOrFail(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Cambiar el estado de una solicitud (transición validada)' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceRequestStatusDto) {
    return this.serviceRequestsService.updateStatus(id, dto.status);
  }
}
