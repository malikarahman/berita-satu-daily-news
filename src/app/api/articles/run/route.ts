import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { runManualArticle } from "@/lib/articles/service";
import { logSystemError } from "@/lib/db/systemLog";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const article = await runManualArticle(body);
    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error("articles:manual-run", error);
    await logSystemError("articles:manual-run", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Form Run Article belum lengkap.", details: error.flatten() },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { error: "Gagal menjalankan pembuatan artikel. Periksa koneksi BMKG atau coba lagi." },
      { status: 500 }
    );
  }
}
