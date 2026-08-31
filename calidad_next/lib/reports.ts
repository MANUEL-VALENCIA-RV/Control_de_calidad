export interface ReportRow {
  id: number;
  cliente: string;
  direccion: string;
  telefono: string;
  fechaReporte: string;
  reporte: string;
  observaciones: string;
  evidencias: string[];
  responsable: string;
  fechaReparacion: string;
  firma: string;
  terminado: boolean;
  [key: string]: unknown;
}

export interface ReportesPage {
  data: ReportRow[];
  total: number;
  page: number;
  pageSize: number;
}

// Caché simple en sessionStorage con patrón stale-while-revalidate:
// se muestra el último dato conocido al instante y se revalida en segundo plano.
const CACHE_PREFIX = "reportes-cache-v1:";
const CACHE_TTL_MS = 60_000;

export function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: T };
    if (Date.now() - parsed.ts > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch { return null; }
}

export function writeCache<T>(key: string, data: T): void {
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data }));
  } catch { /* cuota llena o storage no disponible */ }
}

export function invalidateCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(CACHE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch { /* storage no disponible */ }
}

export async function fetchReportesPage(params: {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
}): Promise<ReportesPage> {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.q) search.set("q", params.q);
  if (params.status && params.status !== "todos") search.set("status", params.status);

  const res = await fetch(`/api/reportes?${search.toString()}`, { method: "GET", cache: "no-store" });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || data?.message || "No se pudieron obtener los reportes");
  if (!data || !Array.isArray(data.data) || typeof data.total !== "number") {
    throw new Error("La API no devolvió una página válida de reportes");
  }
  return data as ReportesPage;
}

type JsonObject = Record<string, unknown>;

async function readJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { error: text }; }
}

async function patchReport(id: number, action: string, body: JsonObject) {
  const res = await fetch(`/api/reportes/${encodeURIComponent(String(id))}/${action}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.error || data?.message || `Error al actualizar ${action}`);
  return data;
}

export const updateObservaciones = (id: number, observaciones: string) =>
  patchReport(id, "observaciones", { observaciones });

export const updateResponsable = (id: number, responsable: string) =>
  patchReport(id, "responsable", { responsable });

export const updateFechaReparacion = (id: number, fecha: string) =>
  patchReport(id, "fecha-reparacion", { fecha });

export const updateTelefono = (id: number, telefono: string) =>
  patchReport(id, "telefono", { telefono });

export async function deleteFirma(id: number) {
  const res = await fetch(`/api/reportes/${encodeURIComponent(String(id))}/firma`, { method: "DELETE" });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.error || data?.message || "Error al eliminar firma");
  return data;
}

export async function deleteEvidencia(id: number, fileId: string) {
  const res = await fetch(`/api/reportes/${encodeURIComponent(String(id))}/evidencias`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId }),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.error || data?.message || "Error al eliminar evidencia");
  return data;
}
