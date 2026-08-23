"use client";
import { useState } from "react";
import { updateObservaciones } from "@/lib/reports";
import { CellRead, CellEdit } from "@/components/editable-cell";
import type { ReportRow } from "@/lib/reports";

export function ObservacionesCell({ folio, observaciones, onUpdated }: { folio: string; observaciones: string; onUpdated: (oldFolio: string, row: ReportRow) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(observaciones || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const start = () => { setValue(observaciones || ""); setEditing(true); setError(""); };
  const cancel = () => setEditing(false);
  const save = async () => {
    setSaving(true); setError("");
    try {
      const row = await updateObservaciones(folio, value) as ReportRow;
      setEditing(false);
      onUpdated(folio, row);
    }
    catch { setError("Error al guardar"); }
    finally { setSaving(false); }
  };

  const display = observaciones ? (
    <span className="line-clamp-2">{observaciones}</span>
  ) : undefined;

  if (editing) return <CellEdit value={value} onChange={setValue} onSave={save} onCancel={cancel} saving={saving} error={error} textarea placeholder="Escribe las observaciones..." />;
  return <CellRead value={observaciones} display={display} placeholder="Sin observaciones" onEdit={start} />;
}
