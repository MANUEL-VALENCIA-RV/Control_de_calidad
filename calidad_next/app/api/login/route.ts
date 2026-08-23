import { NextResponse } from "next/server";
import {
    COOKIE_MAX_AGE,
    SESSION_COOKIE,
    createSessionToken,
} from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { getUserByEmail } from "@/lib/users";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || entry.resetAt < now) {
        attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return false;
    }
    entry.count += 1;
    return entry.count > MAX_ATTEMPTS;
}

function clientKey(request: Request): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown"
    );
}

export async function POST(request: Request) {
    const key = clientKey(request);
    if (isRateLimited(key)) {
        return NextResponse.json(
            { error: "Demasiados intentos. Intenta de nuevo más tarde." },
            { status: 429 },
        );
    }

    let body: { email?: string; password?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
        return NextResponse.json({ error: "Correo y contraseña requeridos" }, { status: 400 });
    }

    let user;
    try {
        user = await getUserByEmail(email);
    } catch (err) {
        console.error("Error en getUserByEmail:", err);
        return NextResponse.json({ error: "Error del servicio de autenticación" }, { status: 500 });
    }

    if (!user || !user.activo || !verifyPassword(password, user.password)) {
        return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    attempts.delete(key);

    let token: string;
    try {
        token = createSessionToken(user.email);
    } catch (err) {
        console.error("Error en createSessionToken:", err);
        return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
    });
    return res;
}
