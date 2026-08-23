import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportesModule } from './reportes/reportes.module';
import { SessionGuard } from './auth/session.guard';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ReportesModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: SessionGuard,
    },
  ],
})
export class AppModule {}
