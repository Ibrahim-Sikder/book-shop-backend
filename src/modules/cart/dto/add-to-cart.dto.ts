import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, IsOptional } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'uuid-of-variant', required: false })
  @IsUUID()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
