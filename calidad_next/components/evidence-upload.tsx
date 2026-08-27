"use client";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { deleteEvidencia } from "@/lib/reports";
import type { ReportRow } from "@/lib/reports";

function evidencesAt(list: string[], i: number): string | undefined {
  return list[i]?.trim() || undefined;
}

function EvidencePreview({ visible, index, onIndexChange }: { visible: string[]; index: number; onIndexChange: (i: number) => void }) {
  const safeIndex = Math.min(index, Math.max(0, visible.length - 1));
  const prev = () => onIndexChange(safeIndex > 0 ? safeIndex - 1 : visible.length - 1);
  const next = () => onIndexChange(safeIndex < visible.length - 1 ? safeIndex + 1 : 0);

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-[#0c1322]/95 p-2 shadow-[0_16px_60px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <div className="relative flex items-center justify-center">
        <img
          src={`/api/evidencias/${encodeURIComponent(evidencesAt(visible, safeIndex) ?? "")}`}
          alt={`Evidencia ${safeIndex + 1}`}
          className="max-h-[350px] max-w-[400px] rounded-lg object-contain"
        />
        {visible.length > 1 && (
          <>
            <button type="button" onClick={prev} className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white/80 backdrop-blur-sm transition hover:bg-black/70 hover:text-white">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" onClick={next} className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white/80 backdrop-blur-sm transition hover:bg-black/70 hover:text-white">
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>
      {visible.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-white/70 tabular-nums">
            {safeIndex + 1} / {visible.length}
          </span>
        </div>
      )}
      {visible.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1">
          {visible.map((fileId, i) => (
            <button
              key={fileId}
              type="button"
              onClick={() => onIndexChange(i)}
              className={`shrink-0 overflow-hidden rounded border transition ${i === safeIndex ? "border-white/40 ring-1 ring-white/20" : "border-white/10 opacity-50 hover:opacity-80"}`}
            >
              <img
                src={`/api/evidencias/${encodeURIComponent(fileId)}`}
                alt={`Mini ${i + 1}`}
                className="block size-8 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

function useFloatingPosition(triggerRef: React.RefObject<HTMLDivElement | null>, open: boolean) {
  const [pos, setPos] = useState<{ x: number; y: number; place: "top" | "bottom" }>({ x: 0, y: 0, place: "top" });

  const calculate = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const previewW = 420;
    const previewH = 400;
    const gap = 12;

    let x = rect.left + rect.width / 2 - previewW / 2;
    if (x < gap) x = gap;
    if (x + previewW > vw - gap) x = vw - gap - previewW;

    let place: "top" | "bottom" = "top";
    let y = rect.top - previewH - gap;
    if (y < gap || rect.top - previewH - gap < 0) {
      place = "bottom";
      y = rect.bottom + gap;
      if (y + previewH > vh - gap) y = vh - gap - previewH;
    }

    setPos({ x, y, place });
  }, [triggerRef]);

  useEffect(() => {
    if (!open) return;
    calculate();
    window.addEventListener("scroll", calculate, true);
    window.addEventListener("resize", calculate);
    return () => {
      window.removeEventListener("scroll", calculate, true);
      window.removeEventListener("resize", calculate);
    };
  }, [open, calculate]);

  return pos;
}

export function EvidenceUpload({ folio, evidencias, onUpdated }: { folio: string; evidencias: string[]; onUpdated: (oldFolio: string, row: ReportRow) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pos = useFloatingPosition(triggerRef, hovered);

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

  const onEnter = () => {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
    hoverTimer.current = setTimeout(() => { setPreviewIndex(0); setHovered(true); }, 250);
  };

  const onLeave = () => {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    leaveTimer.current = setTimeout(() => setHovered(false), 150);
  };

  const onPreviewEnter = () => {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
  };

  const onPreviewLeave = () => {
    leaveTimer.current = setTimeout(() => setHovered(false), 100);
  };

  useEffect(() => {
    setMounted(true);
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  return (
    <div className="group/evid relative flex items-center gap-1">
      {count > 0 ? (
        <>
          <div ref={triggerRef} className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
            <button type="button" onClick={() => { setViewerIndex(0); setViewerOpen(true); }} className="relative shrink-0 cursor-pointer overflow-hidden rounded-md border border-white/10 transition hover:border-white/30">
              <img
                src={`/api/evidencias/${encodeURIComponent(visible[0])}`}
                alt="Evidencia"
                className="block size-11 rounded-md object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.opacity = "0.25";
                  e.currentTarget.title = "No se pudo cargar la evidencia";
                }}
              />
              {count > 1 && (
                <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow">+{count - 1}</span>
              )}
            </button>
          </div>
          {mounted && hovered && createPortal(
            <div
              className="fixed z-[200] opacity-100 transition-opacity duration-150"
              style={{ left: pos.x, top: pos.y }}
              onMouseEnter={onPreviewEnter}
              onMouseLeave={onPreviewLeave}
            >
              <EvidencePreview visible={visible} index={previewIndex} onIndexChange={setPreviewIndex} />
            </div>,
            document.body,
          )}
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
