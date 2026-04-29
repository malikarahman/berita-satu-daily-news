import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runArticleGenerationFromWeather } from "@/lib/articles/service";
import { TEMPLATE_OPTIONS } from "@/data/articleTemplates";
import { logSystemError } from "@/lib/db/systemLog";

const schema = z.object({
  weather: z.any(),
  templatePreference: z.enum(TEMPLATE_OPTIONS).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const generated = await runArticleGenerationFromWeather({
      weather: body.weather,
      templatePreference: body.templatePreference
    });
    return NextResponse.json({ generated });
  } catch (error) {
    await logSystemError("article-generation:run", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menjalankan generator artikel." },
      { status: 500 }
    );
  }
}
