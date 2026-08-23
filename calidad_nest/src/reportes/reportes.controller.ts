import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

import { ReportesService, type Reporte } from './reportes.service';
import { DriveService } from '../drive/drive.service';

const UPLOAD_OPTIONS: MulterOptions = {
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
      return;
    }

    callback(
      new BadRequestException('Solo se permiten archivos de imagen'),
      false,
    );
  },
};

@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly reportesService: ReportesService,
    private readonly driveService: DriveService,
  ) {}

  // =========================================================
  // OBTENER TODOS LOS REPORTES
  // =========================================================

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    if (page === undefined && pageSize === undefined) {
      return this.reportesService.findAll();
    }

    return this.reportesService.findPage({ page, pageSize, q, status });
  }

  // =========================================================
  // CREAR REPORTE
  // =========================================================

  @Post()
  create(@Body() body: Omit<Reporte, 'id'>) {
    return this.reportesService.create(body);
  }

  // =========================================================
  // EVIDENCIAS
  // =========================================================

  @Post(':folio/evidencias')
  @UseInterceptors(FileInterceptor('file', UPLOAD_OPTIONS))
  async addEvidencia(
    @Param('folio') folio: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo es obligatorio');
    }

    const fileId = await this.driveService.uploadFile(file);

    try {
      return await this.reportesService.addEvidencia(folio, fileId);
    } catch (error) {
      await this.driveService.deleteFile(fileId).catch(() => {});
      throw error;
    }
  }

  @Delete(':folio/evidencias/:fileId')
  async removeEvidencia(
    @Param('folio') folio: string,
    @Param('fileId') fileId: string,
  ) {
    const reporte = await this.reportesService.removeEvidencia(
      folio,
      fileId,
    );

    await this.driveService.deleteFile(fileId).catch(() => {});

    return reporte;
  }

  @Get('evidencias/:fileId')
  async getEvidencia(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const file = await this.driveService.downloadFile(fileId);

    res.setHeader('Content-Type', file.mimeType);

    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.name}"`,
    );

    res.setHeader('Cache-Control', 'public, max-age=86400');

    res.send(file.buffer);
  }

  // =========================================================
  // FIRMA
  // =========================================================

  // MOSTRAR / DESCARGAR FIRMA
  @Get(':folio/firma')
  async getFirma(
    @Param('folio') folio: string,
    @Res() res: Response,
  ) {
    const fileId = await this.reportesService.getFirma(folio);

    if (!fileId) {
      throw new BadRequestException(
        `El reporte "${folio}" no tiene firma`,
      );
    }

    const file = await this.driveService.downloadFile(fileId);

    res.setHeader('Content-Type', file.mimeType);

    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.name}"`,
    );

    res.setHeader('Cache-Control', 'public, max-age=86400');

    res.send(file.buffer);
  }

  // SUBIR FIRMA
  @Post(':folio/firma')
  @UseInterceptors(FileInterceptor('file', UPLOAD_OPTIONS))
  async addFirma(
    @Param('folio') folio: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo es obligatorio');
    }

    const fileId = await this.driveService.uploadFile(file);

    try {
      return await this.reportesService.addFirma(folio, fileId);
    } catch (error) {
      await this.driveService.deleteFile(fileId).catch(() => {});
      throw error;
    }
  }

  // ELIMINAR FIRMA
  @Delete(':folio/firma')
  async removeFirma(
    @Param('folio') folio: string,
  ) {
    const fileId = await this.reportesService.getFirma(folio);

    const reporte =
      await this.reportesService.removeFirma(folio);

    if (fileId && !fileId.startsWith('demo-firma-')) {
      await this.driveService.deleteFile(fileId).catch(() => {});
    }

    return reporte;
  }

  // =========================================================
  // EDITAR FOLIO
  // =========================================================

  @Patch(':folio')
  setFolio(@Param('folio') folio: string, @Body('folio') nuevoFolio: string) {
    if (!nuevoFolio?.trim()) {
      throw new BadRequestException('El nuevo folio es obligatorio');
    }

    return this.reportesService.setFolio(folio, nuevoFolio.trim());
  }

  // =========================================================
  // FECHA DE REPARACIÓN
  // =========================================================

  @Patch(':folio/fecha-reparacion')
  setFechaReparacion(
    @Param('folio') folio: string,
    @Body('fecha') fecha: string,
  ) {
    return this.reportesService.setFechaReparacion(
      folio,
      fecha ?? '',
    );
  }

  // =========================================================
  // OBSERVACIONES
  // =========================================================

  @Patch(':folio/observaciones')
  setObservaciones(
    @Param('folio') folio: string,
    @Body('observaciones') observaciones: string,
  ) {
    return this.reportesService.setObservaciones(
      folio,
      observaciones ?? '',
    );
  }

  // =========================================================
  // TELEFONO
  // =========================================================

  @Patch(':folio/telefono')
  setTelefono(
    @Param('folio') folio: string,
    @Body('telefono') telefono: string,
  ) {
    return this.reportesService.setTelefono(
      folio,
      telefono ?? '',
    );
  }

  // =========================================================
  // RESPONSABLE
  // =========================================================

  @Patch(':folio/responsable')
  setResponsable(
    @Param('folio') folio: string,
    @Body('responsable') responsable: string,
  ) {
    return this.reportesService.setResponsable(
      folio,
      responsable ?? '',
    );
  }
}
