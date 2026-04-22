import { prisma } from "@/lib/db/prisma";

export async function logSystemError(scope: string, error: unknown, metadata?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);

  try {
    await prisma.systemLog.create({
      data: {
        level: "error",
        scope,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });
  } catch (logError) {
    console.error("system-log-write-failed", logError);
  }
}
