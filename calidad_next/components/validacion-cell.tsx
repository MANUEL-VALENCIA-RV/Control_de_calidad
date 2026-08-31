"use client";

import { useState } from "react";
import { CircleCheck, CircleX, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";

export type Validacion = "pendiente" | "conforme" | "no_conforme";

type Props = {
  id: number;
  validacion: Validacion;
  responsable?: string | null;
  fechaReparacion?: string | null;
  evidencias?: string[] | null;
  onUpdated: () => void;
};

export function ValidacionCell({
  id,
  validacion,
  responsable,
  fechaReparacion,
  evidencias,
  onUpdated,
}: Props) {
  const [open, setOpen] = useState(false);

  const [selected, setSelected] = useState<Validacion | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const tieneResponsable = Boolean(responsable?.trim());

  const tieneFecha = Boolean(fechaReparacion?.trim());

  const tieneEvidencias = Boolean(evidencias?.length);

  const puedeSerConforme = tieneResponsable && tieneFecha && tieneEvidencias;

  function abrir(tipo: Validacion) {
    setSelected(tipo);
    setError("");
    setOpen(true);
  }

  function cerrar() {
    setOpen(false);
    setSelected(null);
    setError("");
  }

  async function confirmar() {
    if (!selected) {
      return;
    }

    if (selected === "conforme" && !puedeSerConforme) {
      setError("Faltan requisitos para marcar este reporte como conforme.");

      return;
    }

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
            validacion: selected,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ?? data?.message ?? "No se pudo actualizar la validación",
        );
      }

      cerrar();
      onUpdated();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        {validacion === "pendiente" && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />
            Pendiente
          </div>
        )}

        {validacion === "conforme" && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-400">
            <CircleCheck className="size-3.5" />
            Conforme
          </div>
        )}

        {validacion === "no_conforme" && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-400">
            <CircleX className="size-3.5" />
            No conforme
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Marcar como conforme"
            onClick={() => abrir("conforme")}
            className="inline-flex size-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400 transition hover:bg-green-500/20"
          >
            <CircleCheck className="size-4" />
          </button>

          <button
            type="button"
            title="Marcar como no conforme"
            onClick={() => abrir("no_conforme")}
            className="inline-flex size-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
          >
            <CircleX className="size-4" />
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onMouseDown={cerrar}
        >
          <div
            className="w-full max-w-md rounded-xl border bg-background p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className={
                  selected === "conforme"
                    ? "flex size-10 items-center justify-center rounded-full bg-green-500/15 text-green-400"
                    : "flex size-10 items-center justify-center rounded-full bg-red-500/15 text-red-400"
                }
              >
                {selected === "conforme" ? (
                  <CircleCheck className="size-5" />
                ) : (
                  <CircleX className="size-5" />
                )}
              </div>

              <div>
                <h2 className="font-semibold">
                  {selected === "conforme"
                    ? "Confirmar conformidad"
                    : "Confirmar no conformidad"}
                </h2>

                <p className="text-xs text-muted-foreground">ID {id}</p>
              </div>
            </div>

            {selected === "conforme" ? (
              <>
                <p className="text-sm text-muted-foreground">
                  ¿Confirmas que la reparación fue revisada y que todo fue
                  completado correctamente?
                </p>

                <div className="mt-4 space-y-2 rounded-lg border p-3">
                  <Requirement
                    texto="Responsable"
                    completo={tieneResponsable}
                  />

                  <Requirement
                    texto="Fecha de reparación"
                    completo={tieneFecha}
                  />

                  <Requirement texto="Evidencia" completo={tieneEvidencias} />
                </div>

                {!puedeSerConforme && (
                  <p className="mt-3 text-xs text-orange-400">
                    Debes completar todos los requisitos antes de marcar este
                    reporte como conforme.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                ¿Confirmas que la reparación todavía presenta problemas y debe
                marcarse como no conforme?
              </p>
            )}

            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={cerrar}
                disabled={saving}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={confirmar}
                disabled={
                  saving || (selected === "conforme" && !puedeSerConforme)
                }
              >
                {saving
                  ? "Guardando..."
                  : selected === "conforme"
                    ? "Confirmar conformidad"
                    : "Marcar no conforme"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Requirement({
  texto,
  completo,
}: {
  texto: string;
  completo: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{texto}</span>

      {completo ? (
        <CircleCheck className="size-4 text-green-400" />
      ) : (
        <CircleX className="size-4 text-red-400" />
      )}
    </div>
  );
}
