import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserByEmail, updateUserPassword } from "@/lib/users";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const body = await request.json() as { actual?: string; nueva?: string; confirmar?: string };
    if (!body.actual || !body.nueva || body.nueva !== body.confirmar) return NextResponse.json({ error: "Datos de contraseña inválidos" }, { status: 400 });
    if (body.nueva.length < 8) return NextResponse.json({ error: "La nueva contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    const user = await getUserByEmail(session.email);
    if (!user || !verifyPassword(body.actual, user.password)) return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
    await updateUserPassword(session.email, hashPassword(body.nueva));
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Error al cambiar contraseña" }, { status: 500 }); }
}
