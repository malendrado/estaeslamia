import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'cliente@example.cl' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Contrasena123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: 'Juana Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: '+56 9 1234 5678', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ description: 'Token de Cloudflare Turnstile generado por el widget del formulario', required: false })
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}
