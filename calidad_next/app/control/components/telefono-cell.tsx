"use client";
import { useState } from "react";
import { updateTelefono } from "@/lib/reports";
import { CellRead, CellEdit } from "@/components/editable-cell";
import type { ReportRow } from "@/lib/reports";

export function TelefonoCell({ folio, telefono, onUpdated }: { folio: string; telefono: string; onUpdated: (oldFolio: string, row: ReportRow) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(telefono || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const start = () => { setValue(telefono || ""); setEditing(true); setError(""); };
  const cancel = () => setEditing(false);
  const save = async () => {
    setSaving(true); setError("");
    try {
      const row = await updateTelefono(folio, value) as ReportRow;
      setEditing(false);
      onUpdated(folio, row);
    }
    catch (e) { setError(e instanceof Error ? e.message : "Error al guardar"); }
    finally { setSaving(false); }
  };

  if (editing) return <CellEdit value={value} onChange={setValue} onSave={save} onCancel={cancel} saving={saving} error={error} inputType="tel" placeholder="231-294-46-48" inputClassName="tabular-nums" />;
  return <CellRead value={telefono} placeholder="Sin teléfono" onEdit={start} className="tabular-nums" />;
}
