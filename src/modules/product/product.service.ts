/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const { images, ...productData } = createProductDto;

    // 1. Generate slug if missing (Guarantee it's a string)
    const slug =
      productData.slug ||
      productData.name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');

    // 2. Prepare payload ensuring slug is present and is a string
    const payload = {
      ...productData,
      slug, // This overwrites the optional slug with a definite string
    };

    // Create Product and Images in a transaction
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: payload,
      });

      // If images are provided, create them
      if (images && images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((url, index) => ({
            url,
            productId: product.id,
            position: index,
          })),
        });
      }

      return this.findOne(product.id); // Return full product with images
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        category: true,
        images: true,
      },
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        reviews: true,
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...productData } = updateProductDto;

    await this.findOne(id); // Check existence

    return this.prisma.$transaction(async (tx) => {
      // Update Product
      await tx.product.update({
        where: { id },
        data: productData,
      });

      // Handle Images: Simple strategy (Delete old, Add new)
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: images.map((url, index) => ({
            url,
            productId: id,
            position: index,
          })),
        });
      }

      return this.findOne(id);
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
