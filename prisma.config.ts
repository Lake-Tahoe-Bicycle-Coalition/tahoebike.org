import { defineConfig, env } from "prisma/config";

// Prisma CLI does not load .env on its own (Prisma 7). Node can.
try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: rely on the environment (CI, Vercel).
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
