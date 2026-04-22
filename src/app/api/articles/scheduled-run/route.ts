import { NextRequest, NextResponse } from "next/server";
import { runScheduledArticles } from "@/lib/articles/service";
import { logSystemError } from "@/lib/db/systemLog";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const locations = Array.isArray(body.locations) ? body.locations : undefined;
    const articles = await runScheduledArticles(locations, body.actorName ?? "System");
    return NextResponse.json({ articles, count: articles.length }, { status: 201 });
  } catch (error) {
    console.error("articles:scheduled-run", error);
    await logSystemError("articles:scheduled-run", error);
    return NextResponse.json(
      { error: "Gagal menjalankan scheduled generation untuk pengujian." },
      { status: 500 }
    );
  }
}
