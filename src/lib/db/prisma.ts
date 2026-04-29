import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function ensureDatabaseConfiguration() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "Konfigurasi database belum ditemukan. Isi DATABASE_URL untuk lokal atau Vercel sebelum menjalankan dashboard."
    );
  }

  const supportedProtocols = [
    "file:",
    "postgresql://",
    "postgres://",
    "prisma+postgres://"
  ];

  const isSupported = supportedProtocols.some((protocol) =>
    databaseUrl.startsWith(protocol)
  );

  if (!isSupported) {
    throw new Error(
      "Konfigurasi database belum sesuai. Gunakan SQLite file:./beritasatu-cuaca.db untuk lokal atau URL Postgres/Neon untuk deployment."
    );
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
