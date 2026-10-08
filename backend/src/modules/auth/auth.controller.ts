import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { UsersService } from '../users/users.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 registros/min por IP: evita creación masiva de cuentas
  @ApiOperation({ summary: 'Registro público de cliente (CUSTOMER)' })
  @ApiResponse({ status: 201, description: 'Cuenta creada (o activada, si ya existía como customer "silencioso"). Devuelve accessToken + datos del usuario.' })
  @ApiResponse({ status: 400, description: 'DTO inválido (email mal formado, password < 8 caracteres, etc.)' })
  @ApiResponse({ status: 409, description: 'Ya existe una cuenta activa registrada con ese email' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos de registro desde esta IP (límite: 5/min)' })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req.ip);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 intentos/min por IP: mitiga fuerza bruta/credential stuffing
  @ApiOperation({ summary: 'Login de cualquier rol (customer, provider, admin)' })
  @ApiResponse({ status: 200, description: 'Login exitoso. Devuelve accessToken + datos del usuario.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas, o cuenta inactiva (ej. customer "silencioso" sin password)' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos de login desde esta IP (límite: 10/min)' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Login/registro con Google (crea CUSTOMER si el email no existía)' })
  @ApiResponse({ status: 200, description: 'Login exitoso. Devuelve accessToken + datos del usuario.' })
  @ApiResponse({ status: 400, description: 'Login con Google no está configurado en este ambiente' })
  @ApiResponse({ status: 401, description: 'Token de Google inválido, email no verificado, o cuenta inactiva' })
  loginWithGoogle(@Body() dto: GoogleLoginDto) {
    return this.authService.loginWithGoogle(dto.idToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Datos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario actual (sin passwordHash)' })
  @ApiResponse({ status: 401, description: 'Token ausente, inválido, expirado, o usuario inactivo' })
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    const user = await this.usersService.findById(currentUser.userId);
    return user;
  }
}
