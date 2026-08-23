// prisma.config.ts
import "dotenv/config"; // 1. IMPORTANTE: Esto carga tu archivo .env
import { defineConfig, env } from "prisma/config"; // 2. Usamos el paquete oficial de Prisma

export default defineConfig({
  schema: "prisma/schema.prisma", // Asegura que Prisma siempre encuentre tu esquema
  migrations: {
    seed: "pnpm tsx ./prisma/seed.ts", // Tu comando corregido para usar pnpm y tsx
  },
  datasource: {
    url: env("DATABASE_URL"), // 3. Forma oficial y segura de Prisma para leer la URL
  },
});
