"use client";
import { useState } from "react";
import { updateResponsable } from "@/lib/reports";
import { CellRead, CellEdit } from "@/components/editable-cell";
import type { ReportRow } from "@/lib/reports";

export function ResponsableCell({ id, responsable, onUpdated }: { id: number; responsable: string; onUpdated: (oldId: number, row: ReportRow) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(responsable || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const start = () => { setValue(responsable || ""); setEditing(true); setError(""); };
  const cancel = () => setEditing(false);
  const save = async () => {
    setSaving(true); setError("");
    try {
      const row = await updateResponsable(id, value) as ReportRow;
      setEditing(false);
      onUpdated(id, row);
    }
    catch { setError("Error al guardar"); }
    finally { setSaving(false); }
  };

  if (editing) return <CellEdit value={value} onChange={setValue} onSave={save} onCancel={cancel} saving={saving} error={error} placeholder="Nombre del responsable..." />;
  const display = responsable ? <span title={responsable}>{responsable}</span> : undefined;
  return <CellRead value={responsable} display={display} placeholder="Sin responsable" onEdit={start} />;
}
