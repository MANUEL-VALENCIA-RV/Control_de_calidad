"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { EvidenceUpload } from "@/components/evidence-upload";
import { FechaReparacion } from "@/components/fecha-reparacion";
import { FirmaUpload } from "@/components/firma-upload";
import { NuevoReporte } from "@/components/nuevo-reporte";
import { FolioCell } from "@/app/control/components/folio-cell";
import { ObservacionesCell } from "@/app/control/components/observaciones-cell";
import { ResponsableCell } from "@/app/control/components/responsable-cell";
import { TelefonoCell } from "@/app/control/components/telefono-cell";

import type { ReportRow } from "@/lib/reports";
import {
  fetchReportesPage,
  invalidateCache,
  readCache,
  writeCache,
} from "@/lib/reports";

type StatusFilter = "todos" | "terminados" | "pendientes";

const statusOptions: {
  value: StatusFilter;
  label: string;
}[] = [
    {
      value: "todos",
      label: "Todos",
    },
    {
      value: "terminados",
      label: "Terminados",
    },
    {
      value: "pendientes",
      label: "Pendientes",
    },
  ];

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;

export default function Reportes() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [status, setStatus] = useState<StatusFilter>("todos");

  const [reports, setReports] = useState<ReportRow[]>([]);

  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [page, setPage] = useState(1);

  const requestRef = useRef(0);

  // Debounce del buscador: no golpear al servidor en cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    const key = `page:${page}|${PAGE_SIZE}|${debouncedQuery}|${status}`;
    const requestId = ++requestRef.current;

    // Stale-while-revalidate: muestra el caché al instante y revalida.
    const cached = readCache<{
      data: ReportRow[];
      total: number;
    }>(key);

    if (cached) {
      setReports(cached.data);
      setTotal(cached.total);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
    }

    try {
      setError(null);

      const result = await fetchReportesPage({
        page,
        pageSize: PAGE_SIZE,
        q: debouncedQuery,
        status,
      });

      if (requestId !== requestRef.current) return;

      setReports(result.data);
      setTotal(result.total);
      writeCache(key, {
        data: result.data,
        total: result.total,
      });
    } catch (error) {
      if (requestId !== requestRef.current) return;

      if (!cached) setReports([]);

      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
      }
    }
  }, [page, debouncedQuery, status]);

  useEffect(() => {
    load();
  }, [load]);

  // Actualiza solo la fila editada en el estado local (sin recargar todo).
  const handleUpdated = useCallback((oldFolio: string, row: ReportRow) => {
    invalidateCache();

    setReports((prev) => prev.map((r) => (r.folio === oldFolio ? row : r)));
  }, []);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const safePage = Math.min(page, pageCount);

  const startItem = total > 0 ? (safePage - 1) * PAGE_SIZE + 1 : 0;

  const endItem = Math.min(safePage * PAGE_SIZE, total);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 py-5 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-foreground">
              Reportes de reparación
            </h1>

            <p className="text-sm text-muted-foreground">
              Control de calidad de las reparaciones registradas.
            </p>
          </div>

          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Nuevo reporte
          </Button>
        </div>

        <Card className="border-none bg-gradient-to-b from-[#1d2f5e] via-[#16233f] to-[#101a30] shadow-[0_8px_40px_rgba(2,0,52,0.35)]">
          <CardHeader className="gap-4 px-5 pt-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="flex min-w-0 flex-col gap-0.5">
              <CardTitle>Viviendas y Desarrollo de Teziutlán</CardTitle>

              <CardDescription>
                Control de Calidad &middot; Reportes de reparación
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-2 md:w-auto md:shrink-0 md:flex-row md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);

                    setPage(1);
                  }}
                  placeholder="Buscar por folio, cliente o reporte..."
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-1 self-start rounded-lg bg-white/[0.06] p-1 md:self-auto">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setStatus(option.value);

                      setPage(1);
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-100 ${status === option.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <p className="text-sm font-semibold text-foreground">
                  Cargando reportes...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Search className="size-5" />
                </div>

                <p className="text-sm font-semibold text-foreground">
                  No se pudo cargar
                </p>

                <p className="max-w-md text-xs text-muted-foreground">
                  {error}
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={load}
                >
                  Intentar de nuevo
                </Button>
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Search className="size-5" />
                </div>

                <p className="text-sm font-semibold text-foreground">
                  Sin resultados
                </p>

                <p className="text-xs text-muted-foreground">
                  No se encontraron reportes con los filtros aplicados.
                </p>
              </div>
            ) : (
              <>
                <div className="w-full overflow-x-auto overscroll-x-contain">
                  <Table className="min-w-[1840px] table-fixed">
                    <colgroup>
                      <col className="w-[120px]" />
                      <col className="w-[200px]" />
                      <col className="w-[230px]" />
                      <col className="w-[125px]" />
                      <col className="w-[140px]" />
                      <col className="w-[300px]" />
                      <col className="w-[250px]" />
                      <col className="w-[130px]" />
                      <col className="w-[165px]" />
                      <col className="w-[155px]" />
                      <col className="w-[125px]" />
                    </colgroup>
                    <TableHeader className="bg-white/[0.04]">
                      <TableRow>
                        <TableHead className="text-center">Folio</TableHead>
                        <TableHead className="text-center">Cliente</TableHead>
                        <TableHead>Dirección</TableHead>
                        <TableHead className="text-center">Teléfono</TableHead>
                        <TableHead className="text-center">Fecha de reporte</TableHead>
                        <TableHead>Reporte</TableHead>
                        <TableHead>Observaciones</TableHead>
                        <TableHead className="text-center">Evidencias</TableHead>
                        <TableHead className="text-center">Responsable</TableHead>
                        <TableHead className="text-center">Fecha de reparación</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((row) => (
                        <TableRow key={row.folio} className="align-middle">
                          <TableCell className="align-middle px-3 py-3 text-center whitespace-nowrap">
                            <div className="flex min-w-0 justify-center">
                              <FolioCell folio={row.folio} onUpdated={handleUpdated} />
                            </div>
                          </TableCell>
                          <TableCell className="align-middle px-3 py-3 text-center">
                            <div
                              className="
                                                                    mx-auto
                                                                    line-clamp-2
                                                                    max-w-full
                                                                    whitespace-normal
                                                                    break-normal
                                                                    text-center
                                                                    font-medium
                                                                    leading-[1.35]
                                                                    text-foreground
                                                                "
                              title={row.cliente}
                            >
                              {row.cliente}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-0 align-middle px-3 py-3 text-left">
                            <div
                              className="
                                                                    line-clamp-3
                                                                    whitespace-normal
                                                                    break-normal
                                                                    text-left
                                                                    leading-[1.4]
                                                                    text-muted-foreground
                                                                "
                              title={row.direccion}
                            >
                              {row.direccion}
                            </div>
                          </TableCell>

                          <TableCell className="align-middle px-2 text-center whitespace-nowrap">
                            <div className="flex justify-center">
                              <TelefonoCell
                                folio={row.folio}
                                telefono={row.telefono}
                                onUpdated={handleUpdated}
                              />
                            </div>
                          </TableCell>

                          <TableCell className="align-middle px-2 text-center whitespace-nowrap text-muted-foreground tabular-nums">
                            {row.fechaReporte}
                          </TableCell>

                          <TableCell className="min-w-0 align-middle px-3 py-3 text-left">
                            <div
                              className="
                                                                    line-clamp-3
                                                                    whitespace-pre-line
                                                                    break-normal
                                                                    text-left
                                                                    leading-[1.4]
                                                                    text-foreground
                                                                "
                              title={row.reporte}
                            >
                              {row.reporte}
                            </div>
                          </TableCell>

                          <TableCell className="min-w-0 align-middle px-3 py-3 text-left">
                            <div className="whitespace-normal break-normal text-left leading-[1.4] text-muted-foreground">
                              <ObservacionesCell
                                folio={row.folio}
                                observaciones={row.observaciones}
                                onUpdated={handleUpdated}
                              />
                            </div>
                          </TableCell>

                          <TableCell className="align-middle px-3 py-3 text-center">
                            <div className="flex min-w-0 items-center justify-center">
                              <EvidenceUpload
                                folio={row.folio}
                                evidencias={row.evidencias}
                                onUpdated={handleUpdated}
                              />
                            </div>
                          </TableCell>

                          <TableCell className="min-w-0 align-middle px-2 py-3 text-center">
                            <div
                              className="
                                                                    mx-auto
                                                                    line-clamp-2
                                                                    max-w-full
                                                                    whitespace-normal
                                                                    break-normal
                                                                    text-center
                                                                    leading-[1.35]
                                                                    text-muted-foreground
                                                                "
                            >
                              <ResponsableCell
                                folio={row.folio}
                                responsable={row.responsable}
                                onUpdated={handleUpdated}
                              />
                            </div>
                          </TableCell>

                          <TableCell className="align-middle px-2 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <FechaReparacion
                                folio={row.folio}
                                fecha={row.fechaReparacion}
                                onUpdated={handleUpdated}
                              />
                            </div>
                          </TableCell>

                          <TableCell className="align-middle px-2 py-3 text-center">
                            <div className="flex min-w-0 flex-col items-center gap-1">
                              {row.terminado ? (
                                <Badge className="w-full max-w-[80px] justify-center gap-1 bg-green-500/15 text-[10px] text-green-400">
                                  <span className="size-1.5 shrink-0 rounded-full bg-green-400" />
                                  Terminado
                                </Badge>
                              ) : (
                                <Badge className="w-full max-w-[80px] justify-center gap-1 bg-orange-500/15 text-[10px] text-orange-400">
                                  <span className="size-1.5 shrink-0 rounded-full bg-orange-400" />
                                  Pendiente
                                </Badge>
                              )}

                              <FirmaUpload
                                folio={row.folio}
                                firma={row.firma}
                                onUpdated={handleUpdated}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Mostrando {startItem}–{endItem} de {total} reportes
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(safePage - 1)}
                      disabled={safePage <= 1}
                    >
                      <ChevronLeft className="size-4" />
                      Anterior
                    </Button>

                    <span className="px-2 text-xs text-muted-foreground tabular-nums">
                      Página {safePage} de {pageCount}
                    </span>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(safePage + 1)}
                      disabled={safePage >= pageCount}
                    >
                      Siguiente
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <NuevoReporte
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => {
          invalidateCache();
          setPage(1);
          load();
        }}
      />
    </div>
  );
}
