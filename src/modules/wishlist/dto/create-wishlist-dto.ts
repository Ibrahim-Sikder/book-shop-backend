import { ApiProperty } from '@nestjs/swagger';

export class WishlistResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  createdAt: Date;
}
