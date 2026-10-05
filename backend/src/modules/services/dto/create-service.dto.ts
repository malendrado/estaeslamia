import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Gasfitería' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty({ description: 'UUID de la categoría a la que pertenece' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
