import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateArticleWorkflow } from "@/lib/articles/service";

const schema = z.object({
  notes: z.string().nullable().optional(),
  actorName: z.string().optional()
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = schema.parse(await request.json());
    const article = await updateArticleWorkflow(Number(params.id), {
      notes: body.notes,
      actorName: body.actorName
    });
    return NextResponse.json({ article });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memperbarui catatan artikel." },
      { status: 400 }
    );
  }
}
