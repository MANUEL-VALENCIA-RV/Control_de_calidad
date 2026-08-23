import { NextResponse } from "next/server";
import { nestUrl, proxyJson, sessionToken } from "../../_utils";

export async function PATCH(request: Request, { params }: { params: Promise<{ folio: string }> }) {
  try {
    const token = await sessionToken();
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { folio } = await params;
    const body = await request.text();
    const res = await fetch(nestUrl(`/reportes/${encodeURIComponent(folio)}/observaciones`), { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" }, body, cache: "no-store" });
    return proxyJson(res);
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error de conexión" }, { status: 502 }); }
}
