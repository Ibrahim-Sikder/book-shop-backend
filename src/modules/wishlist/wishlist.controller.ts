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

@ApiTags('Wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get logged-in user wishlist' })
  async findAll(@GetUser('id') userId: string) {
    return this.wishlistService.findAll(userId);
  }

  @Post('toggle/:productId')
  @ApiOperation({ summary: 'Toggle wishlist item (Add / Remove)' })
  @ApiParam({ name: 'productId', type: String })
  async toggle(
    @GetUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.toggle(userId, productId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove wishlist item by ID' })
  @ApiParam({ name: 'id', type: String })
  async remove(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.wishlistService.remove(userId, id);
  }
}
