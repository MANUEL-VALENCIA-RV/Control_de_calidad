import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { DriveModule } from '../drive/drive.module';

@Module({
  imports: [DriveModule],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
