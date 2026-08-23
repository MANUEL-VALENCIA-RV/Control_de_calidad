import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

function parseStored(stored: string): { salt: string; hash: string } | null {
  if (!stored) return null;
  const clean = stored.startsWith("scrypt:") ? stored.slice(7) : stored;
  const parts = clean.split(":");
  if (parts.length !== 2) return null;
  const [salt, hash] = parts;
  return salt && hash ? { salt, hash } : null;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parsed = parseStored(stored);
    if (!parsed) return false;
    const expected = Buffer.from(parsed.hash, "hex");
    const actual = scryptSync(password, parsed.salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
