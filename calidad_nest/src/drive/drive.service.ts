import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);
  private drive: ReturnType<typeof google.drive> | undefined;

  private getDrive(): ReturnType<typeof google.drive> {
    if (this.drive) return this.drive;

    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI?.trim() || 'http://localhost:8080';

    if (!clientId || !clientSecret || !refreshToken) {
      throw new InternalServerErrorException(
        'Google Drive no está configurado: revisa GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REFRESH_TOKEN',
      );
    }

    const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    auth.setCredentials({ refresh_token: refreshToken });

    this.drive = google.drive({ version: 'v3', auth });
    return this.drive;
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();

    if (!folderId) {
      throw new InternalServerErrorException(
        'Falta GOOGLE_DRIVE_FOLDER_ID en el servidor',
      );
    }

    if (!file?.buffer) {
      throw new InternalServerErrorException(
        'El archivo no llegó correctamente al servidor',
      );
    }

    try {
      const drive = this.getDrive();

      this.logger.log(
        `Subiendo ${file.originalname} (${file.mimetype}, ${file.size} bytes)`,
      );

      const response = await drive.files.create({
        requestBody: {
          name: file.originalname,
          parents: [folderId],
        },
        media: {
          mimeType: file.mimetype,
          body: Readable.from(file.buffer),
        },
        fields: 'id,name,mimeType,parents',
        supportsAllDrives: true,
      });

      const fileId = response.data.id;

      if (!fileId) {
        throw new Error('Google Drive no devolvió el ID del archivo');
      }

      this.logger.log(`Archivo subido correctamente a Drive: ${fileId}`);
      return fileId;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `ERROR GOOGLE DRIVE: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new BadGatewayException({
        message: 'No se pudo subir la imagen a Google Drive',
        googleDriveError: message,
      });
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      const drive = this.getDrive();
      await drive.files.delete({ fileId, supportsAllDrives: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`No se pudo eliminar ${fileId} de Drive: ${message}`);
      throw error;
    }
  }

  async downloadFile(
    fileId: string,
  ): Promise<{ buffer: Buffer; mimeType: string; name: string }> {
    try {
      const drive = this.getDrive();

      const meta = await drive.files.get({
        fileId,
        fields: 'name,mimeType',
        supportsAllDrives: true,
      });

      const response = await drive.files.get(
        { fileId, alt: 'media', supportsAllDrives: true },
        { responseType: 'arraybuffer' },
      );

      return {
        buffer: Buffer.from(response.data as ArrayBuffer),
        mimeType: meta.data.mimeType ?? 'application/octet-stream',
        name: meta.data.name ?? 'archivo',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error descargando ${fileId}: ${message}`);

      throw new BadGatewayException({
        message: 'No se pudo obtener el archivo de Google Drive',
        googleDriveError: message,
      });
    }
  }
}
