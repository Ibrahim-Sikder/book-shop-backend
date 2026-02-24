import { Module } from '@nestjs/common';
import { OrderService } from './orders.service';
import { OrderController } from './orders.controller';

@Module({
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrdersModule {}
