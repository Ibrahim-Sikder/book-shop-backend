/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    // 1. Generate slug if not provided
    const slug =
      createCategoryDto.slug ||
      createCategoryDto.name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');

    // 2. Prepare data to avoid type conflicts (especially with parentId)
    const { parentId, ...restData } = createCategoryDto;

    const data: any = {
      ...restData,
      slug,
      // Only add parentId if it exists in the DTO
      ...(parentId && { parentId }),
    };

    return this.prisma.category.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // Check existence
    await this.findOne(id);

    // Handle parentId update similarly
    const { parentId, ...restData } = updateCategoryDto;
    const data: any = {
      ...restData,
      ...(parentId !== undefined && { parentId }),
    };

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
