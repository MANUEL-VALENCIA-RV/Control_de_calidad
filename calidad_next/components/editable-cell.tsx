"use client";
import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, Pencil, X } from "lucide-react";

export function EditableCell({
  value,
  placeholder,
  display,
  saving,
  error,
  onSave,
  onCancel,
  children,
}: {
  value: string;
  placeholder: string;
  display?: React.ReactNode;
  saving?: boolean;
  error?: string;
  onSave?: () => void;
  onCancel?: () => void;
  children: (props: { stopEdit: () => void }) => React.ReactNode;
}) {
  return <>{children({ stopEdit: onCancel ?? (() => {}) })}</>;
}

export function CellRead({
  value,
  placeholder,
  display,
  onEdit,
  className = "",
}: {
  value: string;
  placeholder: string;
  display?: React.ReactNode;
  onEdit: () => void;
  className?: string;
}) {
  return (
    <div
      className={`group/edit relative flex min-w-0 items-center gap-1 ${className}`}
    >
      <span className="min-w-0 truncate text-xs text-muted-foreground">
        {display ?? (value || placeholder)}
      </span>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded p-0.5 text-muted-foreground/0 transition-colors hover:bg-white/10 hover:text-foreground group-hover/edit:text-muted-foreground"
        aria-label="Editar"
      >
        <Pencil className="size-3" />
      </button>
    </div>
  );
}

export function CellEdit({
  value,
  onChange,
  onSave,
  onCancel,
  saving,
  error,
  inputType = "text",
  placeholder,
  textarea = false,
  inputClassName = "",
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  error?: string;
  inputType?: string;
  placeholder?: string;
  textarea?: boolean;
  inputClassName?: string;
}) {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      {textarea ? (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`w-full min-w-0 resize-none rounded border border-input bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground ${inputClassName}`}
        />
      ) : (
        <input
          ref={ref as React.RefObject<HTMLInputElement>}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-7 w-full min-w-0 rounded border border-input bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground ${inputClassName}`}
        />
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex h-5 items-center gap-0.5 rounded bg-primary/80 px-1.5 text-[10px] font-medium text-primary-foreground transition-colors hover:bg-primary disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle className="size-2.5 animate-spin" />
          ) : (
            <Check className="size-2.5" />
          )}
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-5 items-center gap-0.5 rounded px-1.5 text-[10px] text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <X className="size-2.5" />
        </button>
      </div>
      {error && (
        <span className="text-[10px] text-destructive">{error}</span>
      )}
    </div>
  );
}
