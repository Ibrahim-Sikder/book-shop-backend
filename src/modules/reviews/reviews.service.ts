import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReviewResponseDto, UpdateReviewDto } from './dto/update-review.dto';
import { CreateReviewDto } from './dto/create-reviews-dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    // Check if user already reviewed this product
    const existing = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });

    if (existing) {
      throw new BadRequestException('You have already reviewed this product.');
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        ...dto,
      },
      include: { user: true, product: true },
    });

    return this.mapToDto(review);
  }

  async findAll(productId?: string) {
    const where = productId ? { productId } : {};
    const reviews = await this.prisma.review.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return reviews.map((r) => this.mapToDto(r));
  }

  async findOne(id: string): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!review) throw new NotFoundException('Review not found');
    return this.mapToDto(review);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    // Ensure user owns the review
    const review = await this.prisma.review.findFirst({
      where: { id, userId },
    });
    if (!review)
      throw new NotFoundException('Review not found or unauthorized');

    const updated = await this.prisma.review.update({
      where: { id },
      data: dto,
      include: { user: true },
    });
    return this.mapToDto(updated);
  }

  async remove(id: string, userId: string) {
    const review = await this.prisma.review.findFirst({
      where: { id, userId },
    });
    if (!review)
      throw new NotFoundException('Review not found or unauthorized');

    await this.prisma.review.delete({ where: { id } });
    return { message: 'Review deleted successfully' };
  }

  private mapToDto(review: any): ReviewResponseDto {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      isVerified: review.isVerified,
      productId: review.productId,
      userId: review.userId,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}
