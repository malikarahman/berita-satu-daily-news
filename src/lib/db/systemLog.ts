import { prisma } from "@/lib/db/prisma";

type ErrorLogInput = {
  errorType?: string;
  module: string;
  action: string;
  message?: string;
  technicalDetails?: string | null;
  articleId?: number | null;
  location?: string | null;
  sourceUrl?: string | null;
  actor?: string | null;
  result?: string | null;
};

export async function logSystemError(scope: string, error: unknown, metadata?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  const technicalDetails = error instanceof Error ? error.stack ?? error.message : String(error);

  await logError({
    errorType: "system_error",
    module: scope.split(":")[0] ?? scope,
    action: scope,
    message,
    technicalDetails,
    result: "failed",
    location: typeof metadata?.location === "string" ? metadata.location : null,
    sourceUrl: typeof metadata?.sourceUrl === "string" ? metadata.sourceUrl : null,
    actor: typeof metadata?.actor === "string" ? metadata.actor : null,
    articleId: typeof metadata?.articleId === "number" ? metadata.articleId : null
  });
}

export async function logError(input: ErrorLogInput) {
  try {
    await prisma.errorLog.create({
      data: {
        errorType: input.errorType ?? "application_error",
        module: input.module,
        action: input.action,
        message: input.message ?? "Unknown application error",
        technicalDetails: input.technicalDetails ?? null,
        articleId: input.articleId ?? null,
        location: input.location ?? null,
        sourceUrl: input.sourceUrl ?? null,
        actor: input.actor ?? null,
        result: input.result ?? "failed"
      }
    });
  } catch (logError) {
    console.error("system-log-write-failed", logError);
  }
}
