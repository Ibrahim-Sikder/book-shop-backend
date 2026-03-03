/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { AddressModule } from './modules/address/address.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PaymentsService } from './modules/payments/payments.service';
import { MediaController } from './modules/media-stock/media-stock.controller';
import { MediaService } from './modules/media-stock/media-stock.service';
import { MediaModule } from './modules/media-stock/media-stock.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    CategoryModule,
    ProductModule,
    AddressModule,
    CartModule,
    OrdersModule,
    ReviewsModule,
    WishlistModule,
    CouponsModule,
    PaymentsModule,
    MediaModule,
  ],
  controllers: [AppController, MediaController],
  providers: [AppService, PaymentsService, MediaService],
})
export class AppModule { }
