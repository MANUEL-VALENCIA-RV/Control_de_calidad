"use client";

import { ChangeEvent, useRef, useState } from "react";
import {
  LoaderCircle,
  PenLine,
  Trash2,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";

import { deleteFirma } from "@/lib/reports";
import type { ReportRow } from "@/lib/reports";

export function FirmaUpload({
  id,
  firma,
  onUpdated,
}: {
  id: number;
  firma: string;
  onUpdated: (
    oldId: number,
    row: ReportRow,
  ) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hovered, setHovered] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const firmaUrl = firma
    ? `/api/evidencias/${encodeURIComponent(firma)}`
    : "";

  async function change(
    e: ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const fd = new FormData();

      fd.append("file", file);

      const res = await fetch(
        `/api/reportes/${encodeURIComponent(String(id))}/firma`,
        {
          method: "POST",
          body: fd,
        },
      );

      const data = await res
        .json()
        .catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "No se pudo subir la firma",
        );
      }

      onUpdated(
        id,
        data as ReportRow,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al subir firma",
      );
    } finally {
      setLoading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function remove() {
    setLoading(true);
    setError("");

    try {
      const row =
        (await deleteFirma(
          id,
        )) as ReportRow;

      setViewerOpen(false);
      onUpdated(id, row);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al eliminar firma",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="group/firma flex items-center justify-center gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={change}
      />

      {firma ? (
        <>
          <div
            className="relative"
            onMouseEnter={() =>
              setHovered(true)
            }
            onMouseLeave={() =>
              setHovered(false)
            }
          >
            {/* Miniatura visible */}
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              className="
                flex
                h-12
                w-14
                items-center
                justify-center
                overflow-hidden
                rounded-md
                border
                border-white/10
                bg-white/5
                transition
                hover:border-white/20
                hover:bg-white/10
              "
              aria-label="Abrir firma"
            >
              <img
                src={firmaUrl}
                alt="Firma"
                className="
                  h-full
                  w-full
                  object-contain
                  p-1
                "
              />
            </button>

            {/* Vista previa al pasar el mouse */}
            {hovered && !viewerOpen && (
              <div
                className="
                  pointer-events-none
                  absolute
                  bottom-full
                  left-1/2
                  z-[100]
                  mb-3
                  -translate-x-1/2
                "
              >
                <div
                  className="
                    flex
                    min-h-[120px]
                    min-w-[220px]
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-white/10
                    bg-black/95
                    p-3
                    shadow-2xl
                    backdrop-blur-sm
                  "
                >
                  <img
                    src={firmaUrl}
                    alt="Vista previa de firma"
                    className="
                      block
                      max-h-[200px]
                      max-w-[300px]
                      object-contain
                    "
                  />
                </div>

                <div
                  className="
                    absolute
                    top-full
                    left-1/2
                    -translate-x-1/2
                    border-4
                    border-transparent
                    border-t-black/95
                  "
                />
              </div>
            )}
          </div>

          {/* Eliminar */}
          <button
            type="button"
            disabled={loading}
            onClick={remove}
            className="
              shrink-0
              rounded
              p-1
              text-muted-foreground/0
              transition-colors
              hover:bg-destructive/20
              hover:text-destructive
              group-hover/firma:text-muted-foreground
            "
            aria-label="Eliminar firma"
          >
            {loading ? (
              <LoaderCircle className="size-3 animate-spin" />
            ) : (
              <Trash2 className="size-3" />
            )}
          </button>

          {/* Vista completa al hacer click */}
          {viewerOpen &&
            createPortal(
              <div
                className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4"
                onMouseDown={() => setViewerOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setViewerOpen(false)}
                  className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                  aria-label="Cerrar firma"
                >
                  <X className="size-5" />
                </button>

                <div
                  className="flex max-h-[85vh] max-w-[90vw] items-center justify-center"
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <img
                    src={firmaUrl}
                    alt="Firma"
                    className="max-h-[85vh] max-w-[85vw] rounded-lg bg-white/5 p-2 object-contain"
                  />
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void remove();
                  }}
                  disabled={loading}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-destructive/20 p-2 text-destructive transition-colors hover:bg-destructive/30 disabled:opacity-50"
                  aria-label="Eliminar firma"
                >
                  {loading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>,
              document.body,
            )}
        </>
      ) : (
        <>
          <span className="text-[11px] text-muted-foreground">
            Sin firma
          </span>

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              inputRef.current?.click()
            }
            className="
              shrink-0
              rounded
              p-1
              text-muted-foreground/0
              transition-colors
              hover:bg-white/10
              hover:text-foreground
              group-hover/firma:text-muted-foreground
            "
            aria-label="Subir firma"
          >
            {loading ? (
              <LoaderCircle className="size-3 animate-spin" />
            ) : (
              <PenLine className="size-3" />
            )}
          </button>
        </>
      )}

      {error && (
        <span className="max-w-32 text-[10px] text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
