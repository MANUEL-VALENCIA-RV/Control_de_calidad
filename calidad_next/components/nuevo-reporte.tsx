import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type NuevoReporteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

const initialForm = {
  cliente: "",
  direccion: "",
  telefono: "",
  fechaReporte: "",
  reporte: "",
};

export function NuevoReporte({
  open,
  onOpenChange,
  onCreated,
}: NuevoReporteProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);

  if (!open) {
    return null;
  }

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function closeModal() {
    setError("");
    onOpenChange(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        observaciones: "",
        evidencias: [],
        firma: "",
        responsable: "",
        fechaReparacion: "",
        terminado: false,
      };

      const response = await fetch("/api/reportes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ?? data?.message ?? "No se pudo crear el reporte",
        );
      }

      setForm(initialForm);
      onCreated();
      closeModal();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error al crear el reporte",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={closeModal}
    >
      <div
        className="w-full max-w-lg rounded-xl border bg-background p-5 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">Nuevo reporte</h2>

        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Input
              id="cliente"
              placeholder="Cliente"
              value={form.cliente}
              onChange={(event) => setField("cliente", event.target.value)}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              placeholder="Dirección"
              value={form.direccion}
              onChange={(event) => setField("direccion", event.target.value)}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={(event) => setField("telefono", event.target.value)}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="fechaReporte">Fecha de reporte</Label>
            <Input
              id="fechaReporte"
              type="date"
              value={form.fechaReporte}
              onChange={(event) => setField("fechaReporte", event.target.value)}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="reporte">Reporte</Label>
            <Input
              id="reporte"
              placeholder="Reporte"
              value={form.reporte}
              onChange={(event) => setField("reporte", event.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive sm:col-span-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancelar
            </Button>

            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
