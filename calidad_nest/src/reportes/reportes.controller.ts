import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
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

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

const UPLOAD_OPTIONS: MulterOptions = {
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    if (ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      callback(null, true);
      return;
    }

    callback(
      new BadRequestException(
        'Solo se permiten imágenes JPG, PNG, WEBP, GIF, HEIC o HEIF',
      ),
      false,
    );
  },
};

function hasRealImageSignature(file: Express.Multer.File): boolean {
  const bytes = file.buffer;

  if (!bytes || bytes.length < 12) {
    return false;
  }

  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isGif = bytes.subarray(0, 6).toString('ascii') === 'GIF87a' ||
    bytes.subarray(0, 6).toString('ascii') === 'GIF89a';
  const isWebp =
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  const brand = bytes.subarray(8, 12).toString('ascii');
  const isHeif =
    bytes.subarray(4, 8).toString('ascii') === 'ftyp' &&
    ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand);

  return isJpeg || isPng || isGif || isWebp || isHeif;
}

function assertSafeImage(file: Express.Multer.File): void {
  if (!hasRealImageSignature(file)) {
    throw new BadRequestException(
      'El archivo no contiene una imagen válida',
    );
  }
}

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

  @Post(':id/evidencias')
  @UseInterceptors(FileInterceptor('file', UPLOAD_OPTIONS))
  async addEvidencia(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo es obligatorio');
    }

    assertSafeImage(file);

    const fileId = await this.driveService.uploadFile(file);

    try {
      return await this.reportesService.addEvidencia(Number(id), fileId);
    } catch (error) {
      await this.driveService.deleteFile(fileId).catch(() => {});
      throw error;
    }
  }

  @Delete(':id/evidencias/:fileId')
  async removeEvidencia(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
  ) {
    const reporte = await this.reportesService.removeEvidencia(
      Number(id),
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
    const perteneceAReporte =
      await this.reportesService.archivoPerteneceAReporte(fileId);

    if (!perteneceAReporte) {
      throw new NotFoundException('Archivo no asociado a ningún reporte');
    }

    const file = await this.driveService.downloadFile(fileId);

    res.setHeader('Content-Type', file.mimeType);

    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.name}"`,
    );

    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.send(file.buffer);
  }

  // =========================================================
  // FIRMA
  // =========================================================

  // MOSTRAR / DESCARGAR FIRMA
  @Get(':id/firma')
  async getFirma(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const fileId = await this.reportesService.getFirma(Number(id));

    if (!fileId) {
      throw new BadRequestException(
        `El reporte "${id}" no tiene firma`,
      );
    }

    const file = await this.driveService.downloadFile(fileId);

    res.setHeader('Content-Type', file.mimeType);

    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.name}"`,
    );

    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.send(file.buffer);
  }

  // SUBIR FIRMA
  @Post(':id/firma')
  @UseInterceptors(FileInterceptor('file', UPLOAD_OPTIONS))
  async addFirma(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo es obligatorio');
    }

    assertSafeImage(file);

    const fileId = await this.driveService.uploadFile(file);

    try {
      return await this.reportesService.addFirma(Number(id), fileId);
    } catch (error) {
      await this.driveService.deleteFile(fileId).catch(() => {});
      throw error;
    }
  }

  // ELIMINAR FIRMA
  @Delete(':id/firma')
  async removeFirma(
    @Param('id') id: string,
  ) {
    const fileId = await this.reportesService.getFirma(Number(id));

    const reporte =
      await this.reportesService.removeFirma(Number(id));

    if (fileId && !fileId.startsWith('demo-firma-')) {
      await this.driveService.deleteFile(fileId).catch(() => {});
    }

    return reporte;
  }

  // =========================================================
  // FECHA DE REPARACIÓN
  // =========================================================

  @Patch(':id/fecha-reparacion')
  setFechaReparacion(
    @Param('id') id: string,
    @Body('fecha') fecha: string,
  ) {
    return this.reportesService.setFechaReparacion(
      Number(id),
      fecha ?? '',
    );
  }

  // =========================================================
  // OBSERVACIONES
  // =========================================================

  @Patch(':id/observaciones')
  setObservaciones(
    @Param('id') id: string,
    @Body('observaciones') observaciones: string,
  ) {
    return this.reportesService.setObservaciones(
      Number(id),
      observaciones ?? '',
    );
  }

  // =========================================================
  // TELEFONO
  // =========================================================

  @Patch(':id/telefono')
  setTelefono(
    @Param('id') id: string,
    @Body('telefono') telefono: string,
  ) {
    return this.reportesService.setTelefono(
      Number(id),
      telefono ?? '',
    );
  }

  // =========================================================
  // RESPONSABLE
  // =========================================================

  @Patch(':id/responsable')
  setResponsable(
    @Param('id') id: string,
    @Body('responsable') responsable: string,
  ) {
    return this.reportesService.setResponsable(
      Number(id),
      responsable ?? '',
    );
  }

  // =========================================================
  // REPORTE (historial)
  // =========================================================

  @Post(':id/reporte')
  addReporte(
    @Param('id') id: string,
    @Body('reporte') reporte: string,
  ) {
    if (!reporte?.trim()) {
      throw new BadRequestException(
        'El texto del reporte es obligatorio',
      );
    }
    return this.reportesService.addReporte(
      Number(id),
      reporte.trim(),
    );
  }
}
