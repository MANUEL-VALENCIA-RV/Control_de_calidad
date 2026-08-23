"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo iniciar sesión");
      router.replace("/control"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Error de inicio de sesión"); }
    finally { setLoading(false); }
  }

  return <Card><CardHeader><CardTitle>Iniciar sesión</CardTitle></CardHeader><CardContent>
    <form onSubmit={submit} className="space-y-4">
      <Input type="email" placeholder="Correo" value={email} onChange={e=>setEmail(e.target.value)} required />
      <Input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} required />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
    </form>
  </CardContent></Card>;
}
