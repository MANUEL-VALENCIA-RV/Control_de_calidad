import { NextResponse } from "next/server";
import { nestUrl, proxyJson, sessionToken } from "../../_utils";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await sessionToken(); if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params; const form = await request.formData();
    const res = await fetch(nestUrl(`/reportes/${encodeURIComponent(id)}/firma`), { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form, cache: "no-store" });
    return proxyJson(res);
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error de conexión" }, { status: 502 }); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await sessionToken(); if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params;
    const res = await fetch(nestUrl(`/reportes/${encodeURIComponent(id)}/firma`), { method: "DELETE", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    return proxyJson(res);
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error de conexión" }, { status: 502 }); }
}
