import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export function nestUrl(path: string): string {
  const base = process.env.NEST_API_URL;
  if (!base) throw new Error("NEST_API_URL no está configurada");
  return `${base.replace(/\/$/, "")}${path}`;
}

export async function sessionToken(): Promise<string | null> {
  if (!(await getSession())) return null;
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function proxyJson(response: Response) {
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text || "Respuesta inválida del backend" }; }
  return NextResponse.json(data ?? {}, { status: response.status });
}
