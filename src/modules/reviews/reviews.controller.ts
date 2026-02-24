/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guards';
import { GetUser } from 'src/common/decorators/get-user-decorators';
import { CreateReviewDto } from './dto/create-reviews-dto';

@ApiTags('reviews')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a review' })
  create(@GetUser('id') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews (optional filter by productId)' })
  findAll(@Query('productId') productId?: string) {
    return this.reviewsService.findAll(productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single review' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update my review' })
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete my review' })
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.reviewsService.remove(id, userId);
  }
}
