import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * One Prisma client per process.
 *
 * DATABASE_URL may be either:
 * - a `prisma+postgres://` URL (Prisma Postgres via the Vercel integration), or
 * - any ordinary `postgresql://` URL (local Postgres, Prisma Postgres direct TCP, etc.).
 */
function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }
  if (url.startsWith("prisma+postgres://") || url.startsWith("prisma://")) {
    return new PrismaClient({ accelerateUrl: url });
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

type Client = ReturnType<typeof createClient>;

const globalForPrisma = globalThis as unknown as { prisma?: Client };

export const prisma: Client = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
