"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { addReporte } from "@/lib/reports";
import type { ReportRow } from "@/lib/reports";

export function ReporteCell({ id, reporte, onUpdated }: { id: number; reporte: string[]; onUpdated: (oldId: number, row: ReportRow) => void }) {
  const list = Array.isArray(reporte) ? reporte.filter((v) => typeof v === "string" && v.trim().length > 0) : typeof reporte === "string" && (reporte as unknown as string).trim() ? [(reporte as unknown as string)] : [];
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const visibleCount = 3;
  const hasMore = list.length > visibleCount;
  const displayList = expanded ? list : list.slice(0, visibleCount);
  const remaining = list.length - visibleCount;

  async function submit() {
    const trimmed = value.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError("");
    try {
      const row = (await addReporte(id, trimmed)) as ReportRow;
      setValue("");
      onUpdated(id, row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="group relative"
        onMouseEnter={() => { if (hasMore) setExpanded(true); }}
        onMouseLeave={() => { if (hasMore) setExpanded(false); }}
      >
        {/* contenedor con scroll si está expandido */}
        <div
          className={`${expanded ? "max-h-[140px] overflow-y-auto" : "max-h-[72px] overflow-hidden"} rounded bg-white/[0.02] px-1 py-0.5 transition-all`}
        >
          {list.length === 0 ? (
            <span className="text-xs italic text-muted-foreground">Sin reporte</span>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {displayList.map((entry, idx) => (
                <li
                  key={`${idx}-${entry.slice(0, 10)}`}
                  className="whitespace-pre-line break-words text-left text-xs leading-[1.4] text-foreground"
                  title={entry}
                >
                  <span className="mr-1 inline-block size-1 shrink-0 rounded-full bg-white/30 align-middle" />
                  {entry}
                </li>
              ))}
            </ul>
          )}
        </div>
        {hasMore && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-1 text-left text-[11px] font-medium text-sky-300 hover:text-sky-200"
          >
            +{remaining} más
          </button>
        )}
        {hasMore && expanded && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-1 text-left text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            ver menos
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Agregar actualización..."
          className="h-7 flex-1 rounded border border-white/10 bg-white/[0.04] px-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-white/20 focus:outline-none"
          disabled={saving}
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving || !value.trim()}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded bg-white/10 text-foreground transition hover:bg-white/20 disabled:opacity-40"
          aria-label="Agregar reporte"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      {error && <span className="text-[11px] text-red-400">{error}</span>}
    </div>
  );
}
