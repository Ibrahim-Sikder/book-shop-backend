import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guards';
import { RolesGuard } from 'src/common/guards/role-guards';
import { Roles } from 'src/common/decorators/roles-decorator';
import { Role } from '@prisma/client';
import { CreateCouponDto } from './dto/create-coupon-dto';
import { UpdateCouponDto } from './dto/update-coupon-dto';

@ApiTags('coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Create coupon' })
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Get all coupons' })
  findAll() {
    return this.couponsService.findAll();
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate a coupon code' })
  validate(@Query('code') code: string, @Query('total') total: string) {
    return this.couponsService.validate(code, Number(total));
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Update coupon' })
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Delete coupon' })
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
