import { NextRequest, NextResponse } from "next/server";
import { runAutomatedBatchArticles } from "@/lib/articles/service";
import { logSystemError } from "@/lib/db/systemLog";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};

  try {
    body = await request.json().catch(() => ({}));
    const actorName =
      typeof body.actorName === "string" && body.actorName.trim().length
        ? body.actorName
        : process.env.DEFAULT_EDITOR_NAME ?? "Editor Piket";
    const result = await runAutomatedBatchArticles(actorName);
    return NextResponse.json({
      count: result.articles.length,
      failures: result.failures,
      batchId: result.batchId,
      articles: result.articles
    });
  } catch (error) {
    await logSystemError("articles:automated-generate", error, {
      actor: typeof body.actorName === "string" ? body.actorName : null
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal menjalankan automated batch generation."
      },
      { status: 500 }
    );
  }
}
