import { PrismaService } from '../prisma/prisma.service';

const MESES_ES = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
];

/**
 * Genera folios como AGO268-01:
 * MES + día(2) + último dígito del año + secuencia del día.
 *
 * `fechaReporte` es String en Prisma, por eso el conteo debe compararse
 * contra YYYY-MM-DD y no contra timestamps ISO.
 */
export async function generarFolio(prisma: PrismaService): Promise<string> {
  const ahora = new Date();
  const mes = MESES_ES[ahora.getMonth()];
  const dia = String(ahora.getDate()).padStart(2, '0');
  const anio = String(ahora.getFullYear()).slice(-1);
  const prefijo = `${mes}${dia}${anio}`;
  const fechaHoy = [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, '0'),
    dia,
  ].join('-');

  const count = await prisma.reportes.count({
    where: { fechaReporte: fechaHoy },
  });

  // Si ya existen registros antiguos con otro formato, la secuencia sigue
  // siendo válida y evita reutilizar números del mismo día.
  const secuencia = String(count + 1).padStart(2, '0');
  return `${prefijo}-${secuencia}`;
}
