"use client";
import { useState } from "react";
import { updateFechaReparacion } from "@/lib/reports";
import { CellRead, CellEdit } from "@/components/editable-cell";
import type { ReportRow } from "@/lib/reports";

export function FechaReparacion({ id, fecha, onUpdated }: { id: number; fecha: string; onUpdated: (oldId: number, row: ReportRow) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(fecha || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastFecha, setLastFecha] = useState(fecha);

  if (lastFecha !== fecha) {
    setLastFecha(fecha);
    setValue(fecha || "");
  }

  const start = () => { setValue(fecha || ""); setEditing(true); setError(""); };
  const cancel = () => setEditing(false);
  const save = async () => {
    setSaving(true); setError("");
    try {
      const row = await updateFechaReparacion(id, value) as ReportRow;
      setEditing(false);
      onUpdated(id, row);
    }
    catch (e) { setError(e instanceof Error ? e.message : "Error al guardar"); }
    finally { setSaving(false); }
  };

  if (editing) return <CellEdit value={value} onChange={setValue} onSave={save} onCancel={cancel} saving={saving} error={error} inputType="date" inputClassName="tabular-nums" />;
  return <CellRead value={fecha} placeholder="Sin fecha" onEdit={start} className="tabular-nums" />;
}
