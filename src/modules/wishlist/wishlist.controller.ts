import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guards';
import { GetUser } from 'src/common/decorators/get-user-decorators';

@ApiTags('wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get my wishlist' })
  findAll(@GetUser('id') userId: string) {
    return this.wishlistService.findAll(userId);
  }

  @Post('toggle/:productId')
  @ApiOperation({ summary: 'Add or Remove item from wishlist' })
  @ApiParam({ name: 'productId' })
  toggle(@GetUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlistService.toggle(userId, productId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove specific item by ID' })
  remove(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.wishlistService.remove(userId, id);
  }
}
