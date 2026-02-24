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

    // 1. Generate slug if missing
    const slug =
      productData.slug ||
      productData.name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');

    const payload = {
      ...productData,
      slug,
    };

    // 2. Use Transaction to ensure data consistency
    return this.prisma.$transaction(async (tx) => {
      // Create Product
      const product = await tx.product.create({
        data: payload,
      });

      // Create Images if provided
      if (images && images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((url, index) => ({
            url,
            productId: product.id,
            position: index,
          })),
        });
      }

      // 3. IMPORTANT: Fetch the product using 'tx' (transaction client), NOT 'this.prisma'
      // This allows seeing the uncommitted changes within the transaction.
      const fullProduct = await tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          images: true,
          reviews: true,
        },
      });

      if (!fullProduct) {
        throw new NotFoundException('Product creation failed');
      }

      return fullProduct;
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

    // ট্রানজেকশন শুরু করার আগে চেক করা (this.prisma ব্যবহার করা নিরাপদ)
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // ১. প্রোডাক্ট আপডেট করা
      await tx.product.update({
        where: { id },
        data: productData,
      });

      // ২. ইমেজ হ্যান্ডেল করা
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

      // ৩. আপডেটেড ডাটা ফেচ করা (এখানে this.findOne না ব্যবহার করে tx ব্যবহার করা হয়েছে)
      const updatedProduct = await tx.product.findUnique({
        where: { id },
        include: {
          category: true,
          images: true,
          reviews: true,
        },
      });

      if (!updatedProduct) {
        throw new NotFoundException('Product not found after update');
      }

      return updatedProduct;
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
