"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  LoaderCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";

import { deleteEvidencia } from "@/lib/reports";
import type { ReportRow } from "@/lib/reports";

function evidenceAt(list: string[], index: number): string | undefined {
  return list[index]?.trim() || undefined;
}

function EvidenceImage({
  fileId,
  alt,
  className,
}: {
  fileId: string;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [fileId]);

  if (failed) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-white/[0.05] text-muted-foreground`}
        title="No se pudo cargar la evidencia"
      >
        <ImageIcon className="size-5" />
      </div>
    );
  }

  return (
    <img
      src={`/api/evidencias/${encodeURIComponent(fileId)}`}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function EvidencePreview({
  visible,
  index,
  onIndexChange,
}: {
  visible: string[];
  index: number;
  onIndexChange: (index: number) => void;
}) {
  const safeIndex = Math.min(index, Math.max(0, visible.length - 1));
  const fileId = evidenceAt(visible, safeIndex);
  const prev = () =>
    onIndexChange(safeIndex > 0 ? safeIndex - 1 : visible.length - 1);
  const next = () =>
    onIndexChange(safeIndex < visible.length - 1 ? safeIndex + 1 : 0);

  if (!fileId) return null;

  return (
    <div className="flex w-[420px] flex-col rounded-xl border border-white/10 bg-[#0c1322]/95 p-2 shadow-[0_16px_60px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-lg bg-black/20">
        <EvidenceImage
          fileId={fileId}
          alt={`Evidencia ${safeIndex + 1}`}
          className="max-h-[350px] max-w-[400px] rounded-lg object-contain"
        />

        {visible.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
              aria-label="Evidencia anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
              aria-label="Evidencia siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {visible.length > 1 && (
        <div className="mt-2 flex items-center gap-1 overflow-x-auto">
          {visible.map((id, i) => (
            <button
              key={`${id}-${i}`}
              type="button"
              onClick={() => onIndexChange(i)}
              className={`shrink-0 overflow-hidden rounded border transition ${
                i === safeIndex
                  ? "border-white/40 ring-1 ring-white/20"
                  : "border-white/10 opacity-60 hover:opacity-100"
              }`}
            >
              <EvidenceImage
                fileId={id}
                alt={`Miniatura ${i + 1}`}
                className="block size-9 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceImageViewer({
  evidencias,
  folio,
  index,
  onClose,
  onDeleted,
}: {
  evidencias: string[];
  folio: string;
  index: number;
  onClose: () => void;
  onDeleted: (row: ReportRow) => void;
}) {
  const [current, setCurrent] = useState(index);
  const [deleting, setDeleting] = useState(false);
  const safeIndex = Math.min(current, Math.max(0, evidencias.length - 1));
  const fileId = evidenceAt(evidencias, safeIndex);

  const prev = () =>
    setCurrent((i) => (i > 0 ? i - 1 : evidencias.length - 1));
  const next = () =>
    setCurrent((i) => (i < evidencias.length - 1 ? i + 1 : 0));

  async function remove() {
    if (!fileId || !confirm("¿Eliminar esta evidencia?")) return;

    setDeleting(true);
    try {
      const row = (await deleteEvidencia(folio, fileId)) as ReportRow;
      onDeleted(row);
      const remaining = row.evidencias?.length ?? 0;
      if (remaining <= 0) onClose();
      else if (safeIndex >= remaining) setCurrent(remaining - 1);
    } finally {
      setDeleting(false);
    }
  }

  if (!fileId) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4"
      onMouseDown={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Cerrar"
      >
        <X className="size-5" />
      </button>

      {evidencias.length > 1 && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            prev();
          }}
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:left-4"
          aria-label="Evidencia anterior"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      <div
        className="flex max-h-[85vh] max-w-[90vw] items-center justify-center"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <EvidenceImage
          fileId={fileId}
          alt={`Evidencia ${safeIndex + 1}`}
          className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
        />
      </div>

      {evidencias.length > 1 && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            next();
          }}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:right-4"
          aria-label="Evidencia siguiente"
        >
          <ChevronRight className="size-6" />
        </button>
      )}

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
        {evidencias.length > 1 && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white tabular-nums">
            {safeIndex + 1} / {evidencias.length}
          </span>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void remove();
          }}
          disabled={deleting}
          className="rounded-full bg-destructive/20 p-2 text-destructive transition-colors hover:bg-destructive/30 disabled:opacity-50"
          aria-label="Eliminar evidencia"
        >
          {deleting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function useFloatingPosition(
  triggerRef: React.RefObject<HTMLDivElement | null>,
  open: boolean,
) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const calculate = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const previewW = 420;
    const previewH = 390;
    const gap = 12;

    let x = rect.left + rect.width / 2 - previewW / 2;
    x = Math.max(gap, Math.min(x, window.innerWidth - previewW - gap));

    let y = rect.top - previewH - gap;
    if (y < gap) y = rect.bottom + gap;
    y = Math.max(gap, Math.min(y, window.innerHeight - previewH - gap));

    setPos({ x, y });
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

export function EvidenceUpload({
  folio,
  evidencias,
  onUpdated,
}: {
  folio: string;
  evidencias: string[];
  onUpdated: (oldFolio: string, row: ReportRow) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const visible = (Array.isArray(evidencias) ? evidencias : []).filter(
    (id) => typeof id === "string" && id.trim().length > 0,
  );
  const count = visible.length;
  const pos = useFloatingPosition(triggerRef, hovered);

  async function change(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setLoading(true);
    setError("");

    try {
      let row: ReportRow | undefined;

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `/api/reportes/${encodeURIComponent(folio)}/evidencias`,
          { method: "POST", body: formData },
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.error || data?.message || "No se pudo subir evidencia",
          );
        }
        row = data as ReportRow;
      }

      if (row) onUpdated(folio, row);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onEnter() {
    if (!count) return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    hoverTimer.current = setTimeout(() => {
      setPreviewIndex(0);
      setHovered(true);
    }, 220);
  }

  function onLeave() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    leaveTimer.current = setTimeout(() => setHovered(false), 140);
  }

  function onPreviewEnter() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  }

  function onPreviewLeave() {
    leaveTimer.current = setTimeout(() => setHovered(false), 100);
  }

  useEffect(() => {
    setMounted(true);
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  return (
    <div className="group/evid flex min-w-[92px] items-center justify-center gap-2">
      {count > 0 ? (
        <>
          <div
            ref={triggerRef}
            className="relative shrink-0"
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            <button
              type="button"
              onClick={() => {
                setViewerIndex(0);
                setViewerOpen(true);
              }}
              className="relative flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-white/[0.04] transition hover:border-white/35 hover:bg-white/[0.07]"
              aria-label={`Ver ${count} evidencia${count === 1 ? "" : "s"}`}
            >
              <EvidenceImage
                fileId={visible[0]}
                alt="Evidencia"
                className="block size-full object-cover"
              />
              {count > 1 && (
                <span className="absolute bottom-1 right-1 rounded-full bg-black/75 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white shadow">
                  +{count - 1}
                </span>
              )}
            </button>
          </div>

          {mounted &&
            hovered &&
            createPortal(
              <div
                className="fixed z-[250]"
                style={{ left: pos.x, top: pos.y }}
                onMouseEnter={onPreviewEnter}
                onMouseLeave={onPreviewLeave}
              >
                <EvidencePreview
                  visible={visible}
                  index={previewIndex}
                  onIndexChange={setPreviewIndex}
                />
              </div>,
              document.body,
            )}
        </>
      ) : (
        <span className="whitespace-nowrap text-[11px] text-muted-foreground">
          Sin evidencias
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={change}
      />

      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] p-1.5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground disabled:opacity-50"
        aria-label="Agregar evidencia"
        title="Agregar evidencia"
      >
        {loading ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : (
          <Plus className="size-3.5" />
        )}
      </button>

      {error && (
        <span className="absolute mt-20 max-w-48 rounded bg-background px-2 py-1 text-[10px] text-destructive shadow-lg">
          {error}
        </span>
      )}

      {viewerOpen &&
        mounted &&
        createPortal(
          <EvidenceImageViewer
            evidencias={visible}
            folio={folio}
            index={viewerIndex}
            onClose={() => setViewerOpen(false)}
            onDeleted={(row) => onUpdated(folio, row)}
          />,
          document.body,
        )}
    </div>
  );
}
