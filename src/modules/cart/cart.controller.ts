/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guards';
import { GetUser } from 'src/common/decorators/get-user-decorators';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my cart' })
  getMyCart(@GetUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to cart' })
  addToCart(@GetUser('id') userId: string, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(userId, dto);
  }

  @Delete('remove/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from cart' })
  removeItem(@GetUser('id') userId: string, @Param('itemId') itemId: string) {
    return this.cartService.removeFromCart(userId, itemId);
  }

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear cart' })
  clearCart(@GetUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
