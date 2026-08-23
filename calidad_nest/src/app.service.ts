import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth(): Promise<{
    status: string;
    db: string;
    timestamp: string;
  }> {
    let db = 'up';

    try {
      await this.prisma.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'down';
    }

    return {
      status: 'ok',
      db,
      timestamp: new Date().toISOString(),
    };
  }
}
