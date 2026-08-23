import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

export type Reporte = {
  folio: string;
  cliente: string;
  direccion: string;
  telefono: string;
  fechaReporte: string;
  reporte: string;
  observaciones: string;
  evidencias: string[];
  firma: string;
  responsable: string;
  fechaReparacion: string;
  terminado: boolean;
};

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Reporte[]> {
    return this.prisma.reportes.findMany({
      orderBy: { id: 'desc' },
    });
  }

  async findPage(params: {
    page?: string;
    pageSize?: string;
    q?: string;
    status?: string;
  }): Promise<{
    data: Reporte[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 10));

    const where: Prisma.reportesWhereInput = {};

    if (params.status === 'terminados') {
      where.terminado = true;
    } else if (params.status === 'pendientes') {
      where.terminado = false;
    }

    const q = params.q?.trim();
    if (q) {
      where.OR = [
        { folio: { contains: q, mode: 'insensitive' } },
        { cliente: { contains: q, mode: 'insensitive' } },
        { direccion: { contains: q, mode: 'insensitive' } },
        { telefono: { contains: q, mode: 'insensitive' } },
        { reporte: { contains: q, mode: 'insensitive' } },
        { observaciones: { contains: q, mode: 'insensitive' } },
        { responsable: { contains: q, mode: 'insensitive' } },
      ];
    }

    const data = await this.prisma.reportes.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await this.prisma.reportes.count({ where });

    return { data, total, page, pageSize };
  }

  async setFolio(folioActual: string, nuevoFolio: string): Promise<Reporte> {
    try {
      return await this.prisma.reportes.update({
        where: { folio: folioActual },
        data: { folio: nuevoFolio },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`El folio "${nuevoFolio}" ya existe`);
      }
      throw error;
    }
  }

  async findOne(folio: string): Promise<Reporte | null> {
    return this.prisma.reportes.findFirst({ where: { folio } });
  }

  async create(data: Omit<Reporte, 'id'>): Promise<Reporte> {
    try {
      const reporte = await this.prisma.reportes.create({
        data: {
          folio: data.folio,
          cliente: data.cliente,
          direccion: data.direccion,
          telefono: data.telefono,
          fechaReporte: data.fechaReporte,
          reporte: data.reporte,
          observaciones: data.observaciones,
          evidencias: data.evidencias ?? [],
          firma: data.firma ?? '',
          responsable: data.responsable ?? '',
          fechaReparacion: data.fechaReparacion ?? '',
          terminado: data.terminado ?? false,
        },
      });
      return reporte;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`El folio "${data.folio}" ya existe`);
      }
      throw error;
    }
  }

  async addEvidencia(folio: string, fileId: string): Promise<Reporte> {
    const reporte = await this.prisma.reportes.findFirst({ where: { folio } });
    if (!reporte) {
      throw new NotFoundException(`No existe un reporte con folio "${folio}"`);
    }

    const evidenciasActuales = reporte.evidencias ?? [];
    const nuevaLista = [...evidenciasActuales, fileId];

    return this.prisma.reportes.update({
      where: { folio },
      data: { evidencias: nuevaLista },
    });
  }

  async removeEvidencia(folio: string, fileId: string): Promise<Reporte> {
    const reporte = await this.prisma.reportes.findFirst({ where: { folio } });
    if (!reporte) {
      throw new NotFoundException(`No existe un reporte con folio "${folio}"`);
    }

    const evidenciasActuales = reporte.evidencias ?? [];
    const nuevaLista = evidenciasActuales.filter((id) => id !== fileId);

    return this.prisma.reportes.update({
      where: { folio },
      data: { evidencias: nuevaLista },
    });
  }

  async addFirma(folio: string, fileId: string): Promise<Reporte> {
    const reporte = await this.prisma.reportes.findFirst({ where: { folio } });
    if (!reporte) {
      throw new NotFoundException(`No existe un reporte con folio "${folio}"`);
    }

    return this.prisma.reportes.update({
      where: { folio },
      data: { firma: fileId, terminado: true },
    });
  }

  async setFechaReparacion(folio: string, fecha: string): Promise<Reporte> {
    const reporte = await this.prisma.reportes.findFirst({ where: { folio } });
    if (!reporte) {
      throw new NotFoundException(`No existe un reporte con folio "${folio}"`);
    }

    return this.prisma.reportes.update({
      where: { folio },
      data: { fechaReparacion: fecha },
    });
  }

  async setObservaciones(
    folio: string,
    observaciones: string,
  ): Promise<Reporte> {
    const reporte = await this.prisma.reportes.findFirst({ where: { folio } });
    if (!reporte) {
      throw new NotFoundException(`No existe un reporte con folio "${folio}"`);
    }

    return this.prisma.reportes.update({
      where: { folio },
      data: { observaciones },
    });
  }

  async setTelefono(folio: string, telefono: string): Promise<Reporte> {
    const reporte = await this.prisma.reportes.findFirst({ where: { folio } });
    if (!reporte) {
      throw new NotFoundException(`No existe un reporte con folio "${folio}"`);
    }

    return this.prisma.reportes.update({
      where: { folio },
      data: { telefono },
    });
  }

  async setResponsable(folio: string, responsable: string): Promise<Reporte> {
    const reporte = await this.prisma.reportes.findFirst({ where: { folio } });
    if (!reporte) {
      throw new NotFoundException(`No existe un reporte con folio "${folio}"`);
    }

    return this.prisma.reportes.update({
      where: { folio },
      data: { responsable },
    });
  }

  async getFirma(folio: string): Promise<string | null> {
    const reporte = await this.prisma.reportes.findFirst({ where: { folio } });
    return reporte?.firma ?? null;
  }

  async removeFirma(folio: string): Promise<Reporte> {
    const reporte = await this.prisma.reportes.findFirst({ where: { folio } });
    if (!reporte) {
      throw new NotFoundException(`No existe un reporte con folio "${folio}"`);
    }

    return this.prisma.reportes.update({
      where: { folio },
      data: { firma: '', terminado: false },
    });
  }
}
