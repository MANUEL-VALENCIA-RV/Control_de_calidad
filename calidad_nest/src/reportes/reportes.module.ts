import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { DriveModule } from '../drive/drive.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [DriveModule],
  controllers: [ReportesController],
  providers: [ReportesService, PrismaService],
})
export class ReportesModule {}
