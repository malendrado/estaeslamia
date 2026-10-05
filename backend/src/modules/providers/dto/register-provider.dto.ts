import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterProviderDto {
  // Credenciales de acceso (User)
  @ApiProperty({ example: 'contacto@miempresa.cl' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Contrasena123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: 'Juan Contreras', description: 'Nombre de la persona de contacto' })
  @IsString()
  @MaxLength(150)
  contactName: string;

  // Datos de la empresa (Provider)
  @ApiProperty({ example: 'Gasfitería Los Andes Ltda.' })
  @IsString()
  @MaxLength(200)
  businessName: string;

  @ApiProperty({ example: '+56 9 8765 4321' })
  @IsString()
  @MaxLength(30)
  phone: string;

  @ApiProperty({ required: false, example: 'Especialistas en gasfitería residencial e industrial.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 'https://miempresa.cl' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @ApiProperty({ required: false, example: '+56 9 8765 4321' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string;

  @ApiProperty({ description: 'Token de Cloudflare Turnstile generado por el widget del formulario', required: false })
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}
