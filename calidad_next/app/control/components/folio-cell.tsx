"use client";
import { useState } from "react";
import { CellEdit } from "@/components/editable-cell";
import type { ReportRow } from "@/lib/reports";

export function FolioCell({ folio, onUpdated }: { folio: string; onUpdated: (oldFolio: string, row: ReportRow) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(folio);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const start = () => { setValue(folio); setEditing(true); setError(""); };
  const cancel = () => setEditing(false);

  const save = async () => {
    if (!value.trim() || value === folio) { setEditing(false); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/reportes/${encodeURIComponent(folio)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folio: value.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "Error al actualizar folio");
      setEditing(false);
      setValue(value.trim());
      onUpdated(folio, data as ReportRow);
    } catch (e) { setError(e instanceof Error ? e.message : "Error al guardar"); }
    finally { setSaving(false); }
  };

  if (editing) return <CellEdit value={value} onChange={setValue} onSave={save} onCancel={cancel} saving={saving} error={error} placeholder="Folio" inputClassName="tabular-nums font-semibold" />;
  return (
    <button
      type="button"
      onClick={start}
      className="max-w-full whitespace-nowrap rounded px-1 py-0.5 text-xs font-semibold text-foreground tabular-nums transition hover:bg-white/5"
      title={folio || "Sin folio"}
    >
      {folio || "Sin folio"}
    </button>
  );
}
