"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    PackageCheck,
} from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import type { ReportRow } from "@/lib/reports";
import { readCache, writeCache } from "@/lib/reports";

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    tone,
}: {
    icon: typeof PackageCheck;
    label: string;
    value: string | number;
    sub?: string;
    tone: string;
}) {
    return (
        <Card className="overflow-hidden">
            <CardContent className="flex items-center gap-4 p-5">
                <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone}`}
                >
                    <Icon className="size-6" />
                </div>

                <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                        {value}
                    </span>

                    <span className="truncate text-sm text-muted-foreground">
                        {label}
                    </span>

                    {sub && (
                        <span className="truncate text-xs text-muted-foreground/70">
                            {sub}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function Dashboard() {
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        const key = "dashboard:all";
        const cached = readCache<ReportRow[]>(key);

        if (cached) {
            setReports(cached);
            setLoading(false);
            setError(null);
        } else {
            setLoading(true);
        }

        try {
            setError(null);

            const response = await fetch("/api/reportes", {
                method: "GET",
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                        data?.message ||
                        "No se pudieron cargar los reportes",
                );
            }

            if (!Array.isArray(data)) {
                throw new Error(
                    "La API no devolvió una lista de reportes",
                );
            }

            setReports(data as ReportRow[]);
            writeCache(key, data as ReportRow[]);
        } catch (error) {
            console.error(
                "🔴 Error cargando dashboard:",
                error,
            );

            setReports([]);

            setError(
                error instanceof Error
                    ? error.message
                    : "Error desconocido",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const total = reports.length;

    const terminados = useMemo(
        () =>
            reports.filter(
                (report) => report.terminado,
            ).length,
        [reports],
    );

    const pendientes = total - terminados;

    const pctTerminado =
        total > 0
            ? Math.round(
                  (terminados / total) * 100,
              )
            : 0;

    const pctPendiente =
        total > 0
            ? Math.round(
                  (pendientes / total) * 100,
              )
            : 0;

    const realPendientes = useMemo(
        () =>
            reports
                .filter(
                    (report) => !report.terminado,
                )
                .map((report) => ({
                    folio: report.folio,
                    reporte:
                        report.reporte ||
                        "Sin descripción",
                    fecha:
                        report.fechaReporte ||
                        "Sin fecha",
                    responsable:
                        report.responsable ||
                        "Sin asignar",
                })),
        [reports],
    );

    const previewPendientes =
        realPendientes.slice(0, 2);

    const stats = [
        {
            icon: PackageCheck,
            label: "Total de reportes",
            value: loading ? "..." : total,
            sub: "todos los registros",
            tone: "bg-blue-500/15 text-blue-400",
        },
        {
            icon: CheckCircle2,
            label: "Terminados",
            value: loading ? "..." : terminados,
            sub: `${pctTerminado}% del total`,
            tone: "bg-green-500/15 text-green-400",
        },
        {
            icon: Clock,
            label: "Pendientes",
            value: loading ? "..." : pendientes,
            sub: `${pctPendiente}% del total`,
            tone: "bg-orange-500/15 text-orange-400",
        },
    ];

    const radius = 40;

    const circumference =
        2 * Math.PI * radius;

    const termSeg =
        total > 0
            ? (terminados / total) *
              circumference
            : 0;

    const pendSeg =
        total > 0
            ? (pendientes / total) *
              circumference
            : 0;

    return (
        <div className="flex min-h-full flex-1 flex-col">
            <AppHeader />

            <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 py-5 md:px-6">
                {/* Encabezado */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-semibold text-foreground">
                            Centro de control
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Supervisión del estado,
                            avance y desempeño de las
                            reparaciones.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/control/reportes">
                            Ver reportes
                            <ArrowRight />
                        </Link>
                    </Button>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex flex-col gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                        <p className="text-sm font-medium text-red-400">
                            No se pudieron cargar los
                            reportes
                        </p>

                        <p className="text-xs text-muted-foreground">
                            {error}
                        </p>

                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={load}
                            >
                                Intentar de nuevo
                            </Button>
                        </div>
                    </div>
                )}

                {/* Estadísticas */}
                <section
                    aria-label="Indicadores principales"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                >
                    {stats.map((stat) => (
                        <StatCard
                            key={stat.label}
                            {...stat}
                        />
                    ))}
                </section>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* Gráfica */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Estado de reportes
                            </CardTitle>

                            <CardDescription>
                                Distribución de terminados
                                vs pendientes
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex flex-col items-center justify-center gap-8 pt-2">
                            {loading ? (
                                <div className="flex size-72 items-center justify-center">
                                    <span className="text-sm text-muted-foreground">
                                        Cargando datos...
                                    </span>
                                </div>
                            ) : (
                                <div className="relative size-72">
                                    <svg
                                        viewBox="0 0 100 100"
                                        className="size-full -rotate-90"
                                    >
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r={radius}
                                            fill="none"
                                            strokeWidth="12"
                                            className="stroke-white/10"
                                        />

                                        {pendSeg > 0 && (
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r={
                                                    radius
                                                }
                                                fill="none"
                                                strokeWidth="12"
                                                strokeLinecap="round"
                                                style={{
                                                    stroke:
                                                        "var(--chart-3)",
                                                    strokeDasharray: `${pendSeg} ${
                                                        circumference -
                                                        pendSeg
                                                    }`,
                                                    strokeDashoffset:
                                                        -termSeg,
                                                }}
                                            />
                                        )}

                                        {termSeg > 0 && (
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r={
                                                    radius
                                                }
                                                fill="none"
                                                strokeWidth="12"
                                                strokeLinecap="round"
                                                style={{
                                                    stroke:
                                                        "var(--chart-2)",
                                                    strokeDasharray: `${termSeg} ${
                                                        circumference -
                                                        termSeg
                                                    }`,
                                                }}
                                            />
                                        )}
                                    </svg>

                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-semibold text-foreground">
                                            {total}
                                        </span>

                                        <span className="text-sm text-muted-foreground">
                                            reportes
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                                <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="size-3 rounded-full bg-[var(--chart-2)]" />

                                        <span className="text-base text-muted-foreground">
                                            Terminados
                                        </span>
                                    </div>

                                    <span className="text-base font-semibold text-foreground">
                                        {loading
                                            ? "..."
                                            : terminados}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="size-3 rounded-full bg-[var(--chart-3)]" />

                                        <span className="text-base text-muted-foreground">
                                            Pendientes
                                        </span>
                                    </div>

                                    <span className="text-base font-semibold text-foreground">
                                        {loading
                                            ? "..."
                                            : pendientes}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reportes pendientes */}
                    <Card className="flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <CardTitle>
                                    Reportes pendientes
                                </CardTitle>

                                <CardDescription>
                                    {loading
                                        ? "Cargando reportes..."
                                        : `Mostrando ${previewPendientes.length} de ${realPendientes.length} reportes que necesitan atención`}
                                </CardDescription>
                            </div>

                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                            >
                                <Link href="/control/reportes">
                                    Ver todos
                                    <ArrowRight />
                                </Link>
                            </Button>
                        </CardHeader>

                        <CardContent className="flex flex-1 flex-col p-0">
                            {loading ? (
                                <div className="flex flex-1 items-center justify-center px-6 py-16">
                                    <p className="text-sm text-muted-foreground">
                                        Cargando
                                        reportes...
                                    </p>
                                </div>
                            ) : previewPendientes.length ===
                              0 ? (
                                <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                                    <CheckCircle2 className="size-8 text-green-400" />

                                    <p className="text-sm font-medium text-foreground">
                                        No hay reportes
                                        pendientes
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        Todos los reportes
                                        están terminados.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-1 flex-col overflow-hidden">
                                    <div className="w-full overflow-x-auto">
                                        <table className="w-full min-w-[680px] table-fixed text-sm">
                                            <thead>
                                                <tr className="border-b border-white/10 text-left text-xs font-semibold tracking-wider text-foreground/75 uppercase">
                                                    <th className="w-[12%] px-4 py-3">
                                                        Folio
                                                    </th>

                                                    <th className="w-[35%] px-4 py-3">
                                                        Reporte
                                                    </th>

                                                    <th className="w-[18%] px-4 py-3">
                                                        Fecha
                                                    </th>

                                                    <th className="w-[20%] px-4 py-3">
                                                        Responsable
                                                    </th>

                                                    <th className="w-[15%] px-4 py-3">
                                                        Estado
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {previewPendientes.map(
                                                    (
                                                        report,
                                                    ) => (
                                                        <tr
                                                            key={
                                                                report.folio
                                                            }
                                                            className="border-b border-white/5 transition-colors hover:bg-white/[0.04]"
                                                        >
                                                            <td className="px-4 py-4 align-top font-semibold text-foreground tabular-nums">
                                                                {
                                                                    report.folio
                                                                }
                                                            </td>

                                                            <td className="px-4 py-4 align-top whitespace-normal break-words text-foreground">
                                                                {
                                                                    report.reporte
                                                                }
                                                            </td>

                                                            <td className="px-4 py-4 align-top whitespace-nowrap text-muted-foreground tabular-nums">
                                                                {
                                                                    report.fecha
                                                                }
                                                            </td>

                                                            <td className="px-4 py-4 align-top whitespace-normal break-words text-muted-foreground">
                                                                {
                                                                    report.responsable
                                                                }
                                                            </td>

                                                            <td className="px-4 py-4 align-top">
                                                                <Badge className="gap-1.5 bg-orange-500/15 text-orange-400">
                                                                    <span className="size-1.5 rounded-full bg-orange-400" />
                                                                    Pendiente
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
                                <p className="text-sm text-muted-foreground">
                                    {loading
                                        ? "Cargando..."
                                        : `${realPendientes.length} reportes pendientes en total`}
                                </p>

                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                >
                                    <Link href="/control/reportes">
                                        Ver todos los
                                        reportes
                                        <ArrowRight />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
