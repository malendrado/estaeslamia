import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('event')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // generoso: un visitante genera varios eventos navegando
  @ApiOperation({ summary: 'Registra un evento de producto (público, sin datos personales, fire-and-forget)' })
  async record(@Body() dto: CreateAnalyticsEventDto): Promise<void> {
    await this.analyticsService.record(dto);
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiOperation({ summary: '[ADMIN] Resumen del embudo de conversión (conteos por tipo de evento)' })
  getSummary(@Query('days') days?: string) {
    return this.analyticsService.getSummary(days ? parseInt(days, 10) : undefined);
  }
}
