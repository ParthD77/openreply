import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const isLocal =
    databaseUrl.includes("@localhost") ||
    databaseUrl.includes("@127.0.0.1");

  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString: databaseUrl,
      max: process.env.VERCEL ? 1 : 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });

  globalForPrisma.pool = pool;

  // Vercel releases idle DB connections before suspending a function.
  if (process.env.VERCEL) {
    attachDatabasePool(pool);
  }

  return new PrismaClient({
    adapter: new PrismaPg(pool),
  });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrisma(), prop, receiver);
  },
});