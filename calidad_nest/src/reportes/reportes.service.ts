import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

export type Reporte = {
  id: number;
  cliente: string;
  direccion: string;
  telefono: string;
  fechaReporte: string;
  reporte: string[];
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
    const page = Math.max(
      1,
      Number(params.page) || 1,
    );

    const pageSize = Math.min(
      100,
      Math.max(
        1,
        Number(params.pageSize) || 10,
      ),
    );

    const where: Prisma.reportesWhereInput = {};

    if (params.status === 'terminados') {
      where.terminado = true;
    } else if (params.status === 'pendientes') {
      where.terminado = false;
    }

    const q = params.q?.trim();

    if (q) {
      where.OR = [
        {
          cliente: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          direccion: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          telefono: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          observaciones: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          responsable: {
            contains: q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const data =
      await this.prisma.reportes.findMany({
        where,
        orderBy: {
          id: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

    const total =
      await this.prisma.reportes.count({
        where,
      });

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findOne(
    id: number,
  ): Promise<Reporte | null> {
    return this.prisma.reportes.findFirst({
      where: {
        id,
      },
    });
  }

  private normalizeReporte(
    value: unknown,
  ): string[] {
    if (Array.isArray(value)) {
      return value
        .map((v) => String(v).trim())
        .filter((v) => v.length > 0);
    }
    if (typeof value === 'string') {
      const t = value.trim();
      return t ? [t] : [];
    }
    return [];
  }

  async create(
    data: Omit<Reporte, 'id'>,
  ): Promise<Reporte> {
    const reporteArr = this.normalizeReporte(
      (data as any).reporte,
    );
    try {
      const reporte =
        await this.prisma.reportes.create({
          data: {
            cliente: data.cliente,
            direccion: data.direccion,
            telefono: data.telefono,
            fechaReporte: data.fechaReporte,
            reporte: reporteArr,

            observaciones:
              data.observaciones ?? '',

            evidencias:
              data.evidencias ?? [],

            firma:
              data.firma ?? '',

            responsable:
              data.responsable ?? '',

            fechaReparacion:
              data.fechaReparacion ?? '',

            terminado:
              data.terminado ?? false,
          },
        });

      return reporte;
    } catch (error) {
      console.error(
        'ERROR AL CREAR REPORTE:',
        error,
      );

      throw error;
    }
  }

  async addEvidencia(
    id: number,
    fileId: string,
  ): Promise<Reporte> {
    const reporte =
      await this.prisma.reportes.findFirst({
        where: {
          id,
        },
      });

    if (!reporte) {
      throw new NotFoundException(
        `No existe un reporte con id "${id}"`,
      );
    }

    const evidenciasActuales =
      reporte.evidencias ?? [];

    const nuevaLista = [
      ...evidenciasActuales,
      fileId,
    ];

    return this.prisma.reportes.update({
      where: {
        id,
      },
      data: {
        evidencias: nuevaLista,
      },
    });
  }

  async removeEvidencia(
    id: number,
    fileId: string,
  ): Promise<Reporte> {
    const reporte =
      await this.prisma.reportes.findFirst({
        where: {
          id,
        },
      });

    if (!reporte) {
      throw new NotFoundException(
        `No existe un reporte con id "${id}"`,
      );
    }

    const evidenciasActuales =
      reporte.evidencias ?? [];

    const nuevaLista =
      evidenciasActuales.filter(
        (fid) => fid !== fileId,
      );

    return this.prisma.reportes.update({
      where: {
        id,
      },
      data: {
        evidencias: nuevaLista,
      },
    });
  }

  async addFirma(
    id: number,
    fileId: string,
  ): Promise<Reporte> {
    const reporte =
      await this.prisma.reportes.findFirst({
        where: {
          id,
        },
      });

    if (!reporte) {
      throw new NotFoundException(
        `No existe un reporte con id "${id}"`,
      );
    }

    return this.prisma.reportes.update({
      where: {
        id,
      },
      data: {
        firma: fileId,
        terminado: true,
      },
    });
  }

  async setFechaReparacion(
    id: number,
    fecha: string,
  ): Promise<Reporte> {
    const reporte =
      await this.prisma.reportes.findFirst({
        where: {
          id,
        },
      });

    if (!reporte) {
      throw new NotFoundException(
        `No existe un reporte con id "${id}"`,
      );
    }

    return this.prisma.reportes.update({
      where: {
        id,
      },
      data: {
        fechaReparacion: fecha,
      },
    });
  }

  async setObservaciones(
    id: number,
    observaciones: string,
  ): Promise<Reporte> {
    const reporte =
      await this.prisma.reportes.findFirst({
        where: {
          id,
        },
      });

    if (!reporte) {
      throw new NotFoundException(
        `No existe un reporte con id "${id}"`,
      );
    }

    return this.prisma.reportes.update({
      where: {
        id,
      },
      data: {
        observaciones,
      },
    });
  }

  async setTelefono(
    id: number,
    telefono: string,
  ): Promise<Reporte> {
    const reporte =
      await this.prisma.reportes.findFirst({
        where: {
          id,
        },
      });

    if (!reporte) {
      throw new NotFoundException(
        `No existe un reporte con id "${id}"`,
      );
    }

    return this.prisma.reportes.update({
      where: {
        id,
      },
      data: {
        telefono,
      },
    });
  }

  async setResponsable(
    id: number,
    responsable: string,
  ): Promise<Reporte> {
    const reporte =
      await this.prisma.reportes.findFirst({
        where: {
          id,
        },
      });

    if (!reporte) {
      throw new NotFoundException(
        `No existe un reporte con id "${id}"`,
      );
    }

    return this.prisma.reportes.update({
      where: {
        id,
      },
      data: {
        responsable,
      },
    });
  }

  async getFirma(
    id: number,
  ): Promise<string | null> {
    const reporte =
      await this.prisma.reportes.findFirst({
        where: {
          id,
        },
      });

    return reporte?.firma ?? null;
  }

  async removeFirma(
    id: number,
  ): Promise<Reporte> {
    const reporte =
      await this.prisma.reportes.findFirst({
        where: {
          id,
        },
      });

    if (!reporte) {
      throw new NotFoundException(
        `No existe un reporte con id "${id}"`,
      );
    }

    return this.prisma.reportes.update({
      where: {
        id,
      },
      data: {
        firma: '',
        terminado: false,
      },
    });
  }

  async addReporte(
    id: number,
    texto: string,
  ): Promise<Reporte> {
    const trimmed = texto?.trim();
    if (!trimmed) {
      throw new NotFoundException(
        `El texto del reporte es obligatorio`,
      );
    }
    const reporte =
      await this.prisma.reportes.findFirst({
        where: { id },
      });
    if (!reporte) {
      throw new NotFoundException(
        `No existe un reporte con id "${id}"`,
      );
    }
    const actuales = Array.isArray(
      (reporte as any).reporte,
    )
      ? ((reporte as any).reporte as string[])
      : typeof (reporte as any).reporte ===
          'string'
        ? [(reporte as any).reporte].filter(
            Boolean,
          )
        : [];
    const nuevaLista = [...actuales, trimmed];
    return this.prisma.reportes.update({
      where: { id },
      data: { reporte: nuevaLista },
    });
  }
}
