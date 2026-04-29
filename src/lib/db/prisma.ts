import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function ensureDatabaseConfiguration() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "Konfigurasi database belum ditemukan. Isi DATABASE_URL di file .env sebelum menjalankan dashboard."
    );
  }

  if (!databaseUrl.startsWith("file:")) {
    throw new Error(
      "Konfigurasi database lokal belum sesuai. Ganti DATABASE_URL di .env menjadi file:./beritasatu-cuaca.db, lalu jalankan setup database lokal kembali."
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
