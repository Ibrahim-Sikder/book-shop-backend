/* eslint-disable prettier/prettier */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Prisma v6 স্ট্যান্ডার্ড কনফিগারেশন
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Database connected successfully!');
    } catch (error) {
      console.error('Error connecting to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Database disconnected!');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => typeof key === 'string' && !key.startsWith('_'),
    );

    return Promise.all(
      models.map((modelKey) => {
        if (typeof modelKey === 'string') {
          return this[modelKey].deleteMany();
        }
      }),
    );
  }
}
