"use client";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NuevoReporte({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open:boolean)=>void; onCreated:()=>void }) {
  const [saving,setSaving]=useState(false); const [error,setError]=useState("");
  const [form,setForm]=useState({folio:"",cliente:"",direccion:"",telefono:"",fechaReporte:"",reporte:""});
  useEffect(()=>{if(!open){setError("");}},[open]);
  if(!open)return null;
  function set<K extends keyof typeof form>(key:K,value:string){setForm(v=>({...v,[key]:value}));}
  async function submit(e:FormEvent){e.preventDefault();setSaving(true);setError("");try{const payload={...form,observaciones:"",evidencias:[],firma:"",responsable:"",fechaReparacion:"",terminado:false}; const res=await fetch("/api/reportes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data?.error||data?.message||"No se pudo crear el reporte");onOpenChange(false);setForm({folio:"",cliente:"",direccion:"",telefono:"",fechaReporte:"",reporte:""});onCreated();}catch(err){setError(err instanceof Error?err.message:"Error al crear");}finally{setSaving(false);}}
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={()=>onOpenChange(false)}><div className="w-full max-w-lg rounded-xl border bg-background p-5 shadow-2xl" onMouseDown={e=>e.stopPropagation()}><h2 className="mb-4 text-lg font-semibold">Nuevo reporte</h2><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2"><Input placeholder="Folio" value={form.folio} onChange={e=>set("folio",e.target.value)} required/><Input placeholder="Cliente" value={form.cliente} onChange={e=>set("cliente",e.target.value)} required/><Input placeholder="Dirección" value={form.direccion} onChange={e=>set("direccion",e.target.value)} required/><Input placeholder="Teléfono" value={form.telefono} onChange={e=>set("telefono",e.target.value)} required/><Input type="date" value={form.fechaReporte} onChange={e=>set("fechaReporte",e.target.value)} required/><Input placeholder="Reporte" value={form.reporte} onChange={e=>set("reporte",e.target.value)} required className="sm:col-span-2"/>{error&&<p className="text-sm text-destructive sm:col-span-2">{error}</p>}<div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={()=>onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving?"Guardando...":"Guardar"}</Button></div></form></div></div>;
}
