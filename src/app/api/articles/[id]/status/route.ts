import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ARTICLE_STATUSES } from "@/lib/articles/types";
import { updateArticleWorkflow } from "@/lib/articles/service";

const schema = z.object({
  status: z.enum(ARTICLE_STATUSES),
  actorName: z.string().optional(),
  note: z.string().optional().nullable()
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = schema.parse(await request.json());
    const article = await updateArticleWorkflow(Number(params.id), {
      status: body.status,
      notes: body.note,
      actorName: body.actorName
    });
    return NextResponse.json({ article });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memperbarui status artikel." },
      { status: 400 }
    );
  }
}
