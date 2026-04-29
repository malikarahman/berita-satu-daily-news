import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { runManualArticle } from "@/lib/articles/service";
import type { RunArticleInput } from "@/lib/articles/types";
import { logSystemError } from "@/lib/db/systemLog";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};

  try {
    body = await request.json();
    const article = await runManualArticle(body as RunArticleInput);
    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    await logSystemError("articles:manual-generate", error, {
      location: typeof body.location === "string" ? body.location : null,
      actor: typeof body.triggeredBy === "string" ? body.triggeredBy : null
    });

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please fill in all required fields before running article generation." },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal menjalankan pembuatan artikel manual."
      },
      { status: 500 }
    );
  }
}
