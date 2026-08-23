import { Pool } from "pg";

export type DbUser = {
  id: number;
  email: string;
  password: string;
  nombre: string | null;
  activo: boolean;
};

let pool: Pool | undefined;

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Falta DATABASE_URL");
  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    max: 3,
  });
  return pool;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const result = await getPool().query<DbUser>(
    `SELECT id, email, password, nombre, activo
     FROM usuarios
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email],
  );
  return result.rows[0] ?? null;
}

export async function updateUserPassword(email: string, passwordHash: string): Promise<boolean> {
  const result = await getPool().query(
    `UPDATE usuarios SET password = $1 WHERE LOWER(email) = LOWER($2)`,
    [passwordHash, email],
  );
  return (result.rowCount ?? 0) > 0;
}
