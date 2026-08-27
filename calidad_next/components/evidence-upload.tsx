"use client";
import { ChangeEvent, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { deleteEvidencia } from "@/lib/reports";
import type { ReportRow } from "@/lib/reports";

function EvidenceImageViewer({ evidencias, folio, index, onClose, onDeleted }: { evidencias: string[]; folio: string; index: number; onClose: () => void; onDeleted: (row: ReportRow) => void }) {
  const [current, setCurrent] = useState(index);
  const [deleting, setDeleting] = useState(false);
  const safeIndex = Math.min(current, Math.max(0, evidencias.length - 1));
  const prev = () => setCurrent((i) => (i > 0 ? i - 1 : evidencias.length - 1));
  const next = () => setCurrent((i) => (i < evidencias.length - 1 ? i + 1 : 0));

  async function remove() {
    if (!confirm("Eliminar esta evidencia?")) return;
    setDeleting(true);
    try {
      const fileId = evidencesAt(evidencias, safeIndex);
      if (!fileId) return;
      const row = await deleteEvidencia(folio, fileId) as ReportRow;
      onDeleted(row);
      const remaining = row.evidencias?.length ?? 0;
      if (remaining <= 0) onClose();
      else if (safeIndex >= remaining) setCurrent(remaining - 1);
    } catch { } finally { setDeleting(false); }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onMouseDown={onClose}>
      <button type="button" onClick={onClose} className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X className="size-5" /></button>
      {evidencias.length > 1 && (
        <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:left-4"><ChevronLeft className="size-6" /></button>
      )}
      <div className="flex max-h-[85vh] max-w-[90vw] items-center justify-center" onMouseDown={(e) => e.stopPropagation()}>
        <img src={`/api/evidencias/${encodeURIComponent(evidencesAt(evidencias, safeIndex) ?? "")}`} alt={`Evidencia ${safeIndex + 1}`} className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain" />
      </div>
      {evidencias.length > 1 && (
        <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:right-4"><ChevronRight className="size-6" /></button>
      )}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
        {evidencias.length > 1 && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white tabular-nums">{safeIndex + 1} / {evidencias.length}</span>
        )}
        <button type="button" onClick={(e) => { e.stopPropagation(); remove(); }} disabled={deleting} className="rounded-full bg-destructive/20 p-2 text-destructive transition-colors hover:bg-destructive/30">
          {deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function evidencesAt(list: string[], i: number): string | undefined {
  return list[i]?.trim() || undefined;
}

export function EvidenceUpload({ folio, evidencias, onUpdated }: { folio: string; evidencias: string[]; onUpdated: (oldFolio: string, row: ReportRow) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  async function change(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setLoading(true); setError("");
    try {
      let row: ReportRow | undefined;
      for (const file of files) {
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch(`/api/reportes/${encodeURIComponent(folio)}/evidencias`, { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || data?.message || "No se pudo subir evidencia");
        row = data as ReportRow;
      }
      if (row) onUpdated(folio, row);
    } catch (err) { setError(err instanceof Error ? err.message : "Error al subir"); } finally { setLoading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  const visible = (Array.isArray(evidencias) ? evidencias : []).filter((id) => id && id.trim());
  const count = visible.length;

  return (
    <div className="group/evid relative flex items-center gap-1">
      {count > 0 ? (
        <>
          <div className="relative">
            <button type="button" onClick={() => { setViewerIndex(0); setViewerOpen(true); }} className="group/thumb relative shrink-0 cursor-pointer overflow-hidden rounded border border-white/10 transition hover:border-white/30">
              <img src={`/api/evidencias/${encodeURIComponent(visible[0])}`} alt="Evidencia" className="block size-9 rounded object-cover" loading="lazy" />
              {count > 1 && (
                <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow">+{count - 1}</span>
              )}
            </button>
            <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 opacity-0 invisible scale-95 transition-all duration-200 group-hover/thumb:opacity-100 group-hover/thumb:visible group-hover/thumb:scale-100">
              <div className="rounded-lg border border-white/10 bg-black/90 p-1.5 shadow-xl backdrop-blur-sm">
                <img src={`/api/evidencias/${encodeURIComponent(visible[0])}`} alt="Vista previa" className="block max-h-[200px] max-w-[250px] rounded object-contain" />
                {count > 1 && (
                  <div className="mt-1 border-t border-white/10 pt-1 text-center text-[10px] text-muted-foreground">{count} evidencia{count > 1 ? "s" : ""}</div>
                )}
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90" />
            </div>
          </div>
          <span className="hidden text-[11px] text-muted-foreground lg:inline">{count} ev.</span>
        </>
      ) : (
        <span className="text-[11px] text-muted-foreground">Sin ev.</span>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={change} />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="shrink-0 rounded p-0.5 text-muted-foreground/0 transition-colors hover:bg-white/10 hover:text-foreground group-hover/evid:text-muted-foreground"
        aria-label="Agregar evidencia"
      >
        {loading ? <LoaderCircle className="size-3 animate-spin" /> : <Plus className="size-3" />}
      </button>
      {error && <span className="max-w-32 text-[10px] text-destructive">{error}</span>}
      {viewerOpen && <EvidenceImageViewer evidencias={visible} folio={folio} index={viewerIndex} onClose={() => setViewerOpen(false)} onDeleted={(row) => onUpdated(folio, row)} />}
    </div>
  );
}
