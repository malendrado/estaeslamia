import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty()
  @IsUUID()
  communeId: string;

  @ApiProperty({ example: 'Necesito instalar 2 equipos de aire acondicionado en dormitorios.' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiProperty({ required: false, example: '2026-09-15' })
  @IsOptional()
  @IsDateString()
  preferredDate?: string;

  @ApiProperty({ required: false, example: 600000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMin?: number;

  @ApiProperty({ required: false, example: 900000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMax?: number;

  // Datos de contacto (se usan para crear/reutilizar el User CUSTOMER "silencioso")
  @ApiProperty({ example: 'Juana Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  contactName: string;

  @ApiProperty({ example: 'juana@example.cl' })
  @IsEmail()
  contactEmail: string;

  @ApiProperty({ example: '+56 9 1234 5678' })
  @IsString()
  @MaxLength(30)
  contactPhone: string;

  @ApiProperty({ description: 'Debe ser true: consentimiento explícito para procesar y compartir la solicitud con providers' })
  @IsBoolean()
  consentAccepted: boolean;

  @ApiProperty({ description: 'Token de Cloudflare Turnstile generado por el widget del formulario', required: false })
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}
