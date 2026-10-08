import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ProvidersService } from './providers.service';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { RegisterProviderGoogleDto } from './dto/register-provider-google.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { SetProviderServicesDto } from './dto/set-provider-services.dto';
import { SetProviderCommunesDto } from './dto/set-provider-communes.dto';
import { UpdateProviderStatusDto } from './dto/update-provider-status.dto';
import { FindProvidersQueryDto } from './dto/find-providers-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { UserRole } from '../../common/enums';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';

@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  constructor(
    private readonly providersService: ProvidersService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 registros/min por IP
  @ApiOperation({ summary: 'Registro público de empresa/profesional (crea User rol PROVIDER + Provider en estado PENDING)' })
  @ApiResponse({ status: 201, description: 'Empresa registrada en estado PENDING. Devuelve accessToken + datos del usuario + el Provider creado.' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 409, description: 'Ya existe una cuenta registrada con ese email' })
  @ApiResponse({ status: 429, description: 'Demasiados registros desde esta IP (límite: 5/min)' })
  async register(@Body() dto: RegisterProviderDto, @Req() req: Request) {
    const provider = await this.providersService.register(dto, req.ip);
    const user = await this.usersService.findById(provider.userId);
    const authResult = this.authService.buildAuthResult(user!);
    return { ...authResult, provider };
  }

  @Post('register-google')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Registro de empresa con Google (mismo resultado que /register, sin password)' })
  @ApiResponse({ status: 201, description: 'Empresa registrada en estado PENDING. Devuelve accessToken + datos del usuario + el Provider creado.' })
  @ApiResponse({ status: 400, description: 'DTO inválido, o login con Google no configurado en este ambiente' })
  @ApiResponse({ status: 401, description: 'Token de Google inválido o email no verificado' })
  @ApiResponse({ status: 409, description: 'Ya existe una cuenta registrada con ese email' })
  async registerWithGoogle(@Body() dto: RegisterProviderGoogleDto) {
    const provider = await this.providersService.registerWithGoogle(dto);
    const user = await this.usersService.findById(provider.userId);
    const authResult = this.authService.buildAuthResult(user!);
    return { ...authResult, provider };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROVIDER] Perfil propio de la empresa' })
  getMyProfile(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.providersService.findByUserId(currentUser.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROVIDER] Actualizar datos del perfil de empresa' })
  updateMyProfile(@CurrentUser() currentUser: AuthenticatedUser, @Body() dto: UpdateProviderDto) {
    return this.providersService.updateOwnProfile(currentUser.userId, dto);
  }

  @Post('me/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (_req, file, callback) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        if (!allowed.includes(file.mimetype)) {
          callback(new BadRequestException('Solo se aceptan imágenes JPG, PNG, WEBP o SVG'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '[PROVIDER] Subir/reemplazar el logo de la empresa (JPG/PNG/WEBP/SVG, máx. 2MB)' })
  @ApiResponse({ status: 201, description: 'Logo subido, devuelve el Provider actualizado con el nuevo logoUrl' })
  @ApiResponse({ status: 400, description: 'Archivo faltante, tipo no permitido, o subida de archivos no configurada en este ambiente' })
  async uploadLogo(
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Debes adjuntar un archivo');
    return this.providersService.updateLogo(currentUser.userId, file);
  }

  @Put('me/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROVIDER] Reemplazar la lista completa de servicios ofrecidos' })
  setMyServices(@CurrentUser() currentUser: AuthenticatedUser, @Body() dto: SetProviderServicesDto) {
    return this.providersService.setServices(currentUser.userId, dto.serviceIds);
  }

  @Put('me/communes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROVIDER] Reemplazar la lista completa de comunas de cobertura' })
  setMyCommunes(@CurrentUser() currentUser: AuthenticatedUser, @Body() dto: SetProviderCommunesDto) {
    return this.providersService.setCommunes(currentUser.userId, dto.communeIds);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Providers destacados para la landing pública (sin datos de contacto directo)' })
  getFeatured() {
    return this.providersService.findFeatured();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Listado paginado de providers, opcionalmente filtrado por estado' })
  findAllForAdmin(@Query() query: FindProvidersQueryDto) {
    return this.providersService.findAllForAdmin(query.status, query.page, query.limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Detalle de un provider' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.providersService.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Aprobar/rechazar/suspender un provider' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 403, description: 'Transición de estado no permitida (ej. de REJECTED directo a ACTIVE) o rol insuficiente' })
  @ApiResponse({ status: 404, description: 'Provider no encontrado' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProviderStatusDto) {
    return this.providersService.updateStatus(id, dto.status);
  }
}
