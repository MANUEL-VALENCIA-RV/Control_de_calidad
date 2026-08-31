"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  id: number;
  anomalia: boolean;
  onUpdated: () => void;
};

export function AnomaliaCell({ id, anomalia, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function confirmar() {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/reportes/${encodeURIComponent(String(id))}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            anomalia: !anomalia,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ?? data?.message ?? "No se pudo actualizar la anomalía",
        );
      }

      setOpen(false);
      onUpdated();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={anomalia ? "Anomalía confirmada" : "Marcar como anomalía"}
        className={
          anomalia
            ? "inline-flex size-9 items-center justify-center rounded-lg bg-red-500/15 text-red-400 transition hover:bg-red-500/25"
            : "inline-flex size-9 items-center justify-center rounded-lg bg-white/[0.05] text-muted-foreground transition hover:bg-orange-500/15 hover:text-orange-400"
        }
      >
        <TriangleAlert className="size-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border bg-background p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                <TriangleAlert className="size-5" />
              </div>

              <div>
                <h2 className="font-semibold">
                  {anomalia ? "Quitar anomalía" : "Confirmar anomalía"}
                </h2>

                <p className="text-xs text-muted-foreground">ID {id}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {anomalia
                ? "¿Estás seguro de que deseas quitar la marca de anomalía de este reporte?"
                : "¿Estás seguro de que este reporte representa un problema real y debe marcarse como anomalía?"}
            </p>

            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={confirmar}
                disabled={saving}
                className={
                  anomalia ? "" : "bg-red-600 text-white hover:bg-red-700"
                }
              >
                {saving
                  ? "Guardando..."
                  : anomalia
                    ? "Quitar anomalía"
                    : "Confirmar anomalía"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
