import { NextRequest, NextResponse } from "next/server";
import { runAutomatedBatchArticles } from "@/lib/articles/service";
import { logSystemError } from "@/lib/db/systemLog";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await runAutomatedBatchArticles(body.actorName ?? "Editor Piket");
    return NextResponse.json(
      {
        articles: result.articles,
        count: result.articles.length,
        failures: result.failures,
        batchId: result.batchId
      },
      { status: 201 }
    );
  } catch (error) {
    await logSystemError("batch:run-test", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Automated batch generation failed for one or more configured locations."
      },
      { status: 500 }
    );
  }
}
