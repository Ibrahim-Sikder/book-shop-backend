import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guards';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  async addToCart(@Req() req: any, @Body() addToCartDto: AddToCartDto) {
    const userId = req.user.userId;

    // 2. Pass userId to service
    return this.cartService.addToCart(userId, addToCartDto);
  }

  @Get()
  async getCart(@Req() req: any) {
    const userId = req.user.userId;
    return this.cartService.getCart(userId);
  }

  @Delete('item/:itemId')
  async removeFromCart(@Req() req: any, @Param('itemId') itemId: string) {
    const userId = req.user.userId;
    return this.cartService.removeFromCart(userId, itemId);
  }

  @Delete('clear')
  async clearCart(@Req() req: any) {
    const userId = req.user.userId;
    return this.cartService.clearCart(userId);
  }
}
