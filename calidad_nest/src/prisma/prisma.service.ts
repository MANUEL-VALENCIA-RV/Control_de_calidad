import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  prisma: PrismaClient;

  reportes: PrismaClient['reportes'];

  onModuleInit() {
    const connectionString = process.env.DATABASE_URL ?? '';
    if (!connectionString) {
      throw new Error('Falta la variable de entorno DATABASE_URL');
    }

    const adapter = new PrismaPg({ connectionString });
    this.prisma = new PrismaClient({ adapter });
    this.reportes = this.prisma.reportes;

    this.prisma
      .$connect()
      .then(() => this.logger.log('Conexión a la base de datos establecida'))
      .catch((error) => {
        this.logger.error('No se pudo conectar a la base de datos', error);
      });
  }
}
