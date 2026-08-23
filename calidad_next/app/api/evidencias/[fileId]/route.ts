import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";

const API_URL = process.env.NEST_API_URL ?? "http://localhost:3001";

// Caché en memoria (por instancia) para no re-descargar de Google Drive
// la misma imagen en cada petición. LRU simple con tope de tamaño.
const MAX_ENTRIES = 40;
const cache = new Map<string, { buffer: Buffer; contentType: string; contentDisposition: string }>();

function cacheGet(key: string) {
    const hit = cache.get(key);
    if (!hit) return undefined;
    cache.delete(key);
    cache.set(key, hit);
    return hit;
}

function cacheSet(key: string, value: { buffer: Buffer; contentType: string; contentDisposition: string }) {
    if (cache.has(key)) cache.delete(key);
    cache.set(key, value);
    while (cache.size > MAX_ENTRIES) {
        const oldest = cache.keys().next().value;
        if (oldest === undefined) break;
        cache.delete(oldest);
    }
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ fileId: string }> },
) {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { fileId } = await params;

    const headers = {
        "Cache-Control": "public, max-age=86400",
        "Content-Disposition": "inline",
    } as Record<string, string>;

    const cached = cacheGet(fileId);
    if (cached) {
        return new NextResponse(new Uint8Array(cached.buffer), {
            status: 200,
            headers: {
                ...headers,
                "Content-Type": cached.contentType,
                "Content-Disposition": cached.contentDisposition,
                "X-Cache": "HIT",
            },
        });
    }

    try {
        const res = await fetch(`${API_URL}/reportes/evidencias/${fileId}`, {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            return new NextResponse(null, { status: 404 });
        }

        const contentType = res.headers.get("content-type") ?? "application/octet-stream";
        const contentDisposition = res.headers.get("content-disposition") ?? "inline";
        const buffer = Buffer.from(await res.arrayBuffer());

        cacheSet(fileId, { buffer, contentType, contentDisposition });

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                ...headers,
                "Content-Type": contentType,
                "Content-Disposition": contentDisposition,
            },
        });
    } catch {
        return new NextResponse(null, { status: 502 });
    }
}
