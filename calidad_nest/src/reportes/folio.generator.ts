import { PrismaService } from '../prisma/prisma.service';

const MESES_ES = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
];

export async function generarFolio(prisma: PrismaService): Promise<string> {
  const ahora = new Date();
  const mes = MESES_ES[ahora.getMonth()];
  const dia = String(ahora.getDate()).padStart(2, '0');
  const anio = String(ahora.getFullYear()).slice(-1);
  const prefijo = `${mes}${dia}${anio}`;

  const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const finDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1);

  const count = await prisma.reportes.count({
    where: {
      fechaReporte: {
        gte: inicioDia.toISOString().split('T')[0],
        lt: finDia.toISOString().split('T')[0],
      },
    },
  });

  const secuencia = String(count + 1).padStart(2, '0');
  return `${prefijo}-${secuencia}`;
}