import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";

const MAX_ENTRIES = 40;

const cache = new Map<
  string,
  {
    buffer: Buffer;
    contentType: string;
    contentDisposition: string;
  }
>();

function nestUrl(path: string): string {
  const base = process.env.NEST_API_URL;

  if (!base) {
    throw new Error("NEST_API_URL no está configurada");
  }

  return `${base.replace(/\/$/, "")}${path}`;
}

function cacheGet(key: string) {
  const hit = cache.get(key);

  if (!hit) {
    return undefined;
  }

  cache.delete(key);
  cache.set(key, hit);

  return hit;
}

function cacheSet(
  key: string,
  value: {
    buffer: Buffer;
    contentType: string;
    contentDisposition: string;
  },
) {
  if (cache.has(key)) {
    cache.delete(key);
  }

  cache.set(key, value);

  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;

    if (oldest === undefined) {
      break;
    }

    cache.delete(oldest);
  }
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ fileId: string }>;
  },
) {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 },
      );
    }

    const { fileId } = await params;

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId requerido" },
        { status: 400 },
      );
    }

    const cached = cacheGet(fileId);

    if (cached) {
      return new NextResponse(
        new Uint8Array(cached.buffer),
        {
          status: 200,
          headers: {
            "Content-Type": cached.contentType,
            "Content-Disposition":
              cached.contentDisposition,
            "Cache-Control":
              "public, max-age=86400",
            "X-Cache": "HIT",
          },
        },
      );
    }

    const url = nestUrl(
      `/reportes/evidencias/${encodeURIComponent(fileId)}`,
    );

    console.log("Solicitando evidencia:", url);

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "image/*,*/*",
      },
    });

    if (!res.ok) {
      const body = await res.text();

      console.error("Nest rechazó evidencia:", {
        url,
        fileId,
        status: res.status,
        statusText: res.statusText,
        body,
      });

      return NextResponse.json(
        {
          error: "No se pudo obtener la evidencia",
          backendStatus: res.status,
          backendResponse: body,
        },
        {
          status: res.status,
        },
      );
    }

    const contentType =
      res.headers.get("content-type") ??
      "application/octet-stream";

    const contentDisposition =
      res.headers.get("content-disposition") ??
      "inline";

    const buffer = Buffer.from(
      await res.arrayBuffer(),
    );

    if (buffer.length === 0) {
      console.error(
        "Nest devolvió una evidencia vacía:",
        fileId,
      );

      return NextResponse.json(
        {
          error: "La evidencia llegó vacía",
        },
        { status: 502 },
      );
    }

    cacheSet(fileId, {
      buffer,
      contentType,
      contentDisposition,
    });

    return new NextResponse(
      new Uint8Array(buffer),
      {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition":
            contentDisposition,
          "Content-Length":
            buffer.length.toString(),
          "Cache-Control":
            "public, max-age=86400",
          "X-Cache": "MISS",
        },
      },
    );
  } catch (error) {
    console.error(
      "Error en /api/evidencias/[fileId]:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno cargando evidencia",
      },
      { status: 502 },
    );
  }
}
