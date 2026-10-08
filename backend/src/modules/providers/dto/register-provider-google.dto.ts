import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Igual que RegisterProviderDto, pero sin email/password/contactName —
 * esos tres vienen verificados del ID token de Google, no de lo que el
 * usuario escriba (evita que alguien se registre con un email que no es
 * suyo). Solo pide lo que Google no puede entregar: datos de la empresa.
 */
export class RegisterProviderGoogleDto {
  @ApiProperty({ description: 'ID token entregado por Google Identity Services en el navegador' })
  @IsString()
  idToken: string;

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
}
