import { NextResponse } from "next/server";
import { nestUrl, proxyJson, sessionToken } from "./_utils";

async function tokenOr401() {
  const token = await sessionToken();
  return token;
}

export async function GET(request: Request) {
  try {
    const token = await tokenOr401();
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const search = new URL(request.url).search;
    const res = await fetch(nestUrl(`/reportes${search}`), { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" });
    return proxyJson(res);
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error de conexión" }, { status: 502 }); }
}

export async function POST(request: Request) {
  try {
    const token = await tokenOr401();
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const body = await request.text();
    const res = await fetch(nestUrl("/reportes"), { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" }, body, cache: "no-store" });
    return proxyJson(res);
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error de conexión" }, { status: 502 }); }
}
