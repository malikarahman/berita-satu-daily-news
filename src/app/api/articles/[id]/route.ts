import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getArticle, updateArticleWorkflow } from "@/lib/articles/service";
import { ARTICLE_STATUSES } from "@/lib/articles/types";
import { logSystemError } from "@/lib/db/systemLog";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  status: z.enum(ARTICLE_STATUSES).optional(),
  notes: z.string().nullable().optional(),
  editorName: z.string().nullable().optional(),
  bodyText: z.string().optional(),
  actorName: z.string().optional()
});

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const article = await getArticle(Number(params.id));
    if (!article) {
      return NextResponse.json({ error: "Artikel tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ article });
  } catch (error) {
    console.error("articles:get", error);
    await logSystemError("articles:get", error, { id: params.id });
    return NextResponse.json({ error: "Gagal memuat detail artikel." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const parsed = updateSchema.parse(body);
    const article = await updateArticleWorkflow(Number(params.id), parsed);
    return NextResponse.json({ article });
  } catch (error) {
    console.error("articles:update", error);
    await logSystemError("articles:update", error, { id: params.id });
    const message = error instanceof Error ? error.message : "Gagal memperbarui artikel.";
    return NextResponse.json(
      { error: message },
      { status: message === "Artikel tidak ditemukan." ? 404 : 400 }
    );
  }
}
