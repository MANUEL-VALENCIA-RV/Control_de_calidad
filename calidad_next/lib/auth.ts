import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "cc_session";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Falta AUTH_SECRET");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createSessionToken(email: string): string {
  const exp = Date.now() + COOKIE_MAX_AGE * 1000;
  const payload = `${email}|${exp}`;
  return `${payload}|${sign(payload)}`;
}

export function verifySessionToken(token: string): string | null {
  const parts = token.split("|");
  if (parts.length !== 3) return null;
  const [email, expStr, signature] = parts;
  const exp = Number(expStr);
  if (!email || !Number.isFinite(exp) || exp < Date.now()) return null;
  const expected = Buffer.from(sign(`${email}|${expStr}`));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  return email;
}

export async function getSession(): Promise<{ email: string } | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const email = verifySessionToken(token);
  return email ? { email } : null;
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}
