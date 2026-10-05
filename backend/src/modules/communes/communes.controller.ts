import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CommunesService } from './communes.service';

@ApiTags('communes')
@Controller('communes')
export class CommunesController {
  constructor(private readonly communesService: CommunesService) {}

  @Get()
  @ApiQuery({ name: 'regionId', required: false })
  @ApiOperation({ summary: 'Listado público de comunas, opcionalmente filtrado por región' })
  findAll(@Query('regionId') regionId?: string) {
    return this.communesService.findAll(regionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una comuna' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.communesService.findById(id);
  }
}
