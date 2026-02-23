import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'electronics', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'All kinds of gadgets', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'http://image.url', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 'uuid-of-parent-category', required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
