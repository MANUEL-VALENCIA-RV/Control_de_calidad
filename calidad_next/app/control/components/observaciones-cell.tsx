"use client";
import { useState } from "react";
import { updateObservaciones } from "@/lib/reports";
import { CellRead, CellEdit } from "@/components/editable-cell";
import type { ReportRow } from "@/lib/reports";

export function ObservacionesCell({ id, observaciones, onUpdated }: { id: number; observaciones: string; onUpdated: (oldId: number, row: ReportRow) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(observaciones || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const start = () => { setValue(observaciones || ""); setEditing(true); setError(""); };
  const cancel = () => setEditing(false);
  const save = async () => {
    setSaving(true); setError("");
    try {
      const row = await updateObservaciones(id, value) as ReportRow;
      setEditing(false);
      onUpdated(id, row);
    }
    catch { setError("Error al guardar"); }
    finally { setSaving(false); }
  };

  const display = observaciones ? (
    <span className="line-clamp-2" title={observaciones}>{observaciones}</span>
  ) : undefined;

  if (editing) return <CellEdit value={value} onChange={setValue} onSave={save} onCancel={cancel} saving={saving} error={error} textarea placeholder="Escribe las observaciones..." />;
  return <CellRead value={observaciones} display={display} placeholder="Sin observaciones" onEdit={start} />;
}
