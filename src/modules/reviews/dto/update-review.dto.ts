import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateReviewDto } from './create-reviews-dto';
export class UpdateReviewDto extends PartialType(CreateReviewDto) {}

export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  comment: string | null;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
