import { NextRequest, NextResponse } from "next/server";
import { listArticles } from "@/lib/articles/service";
import { logSystemError } from "@/lib/db/systemLog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const payload = await listArticles(request.nextUrl.searchParams);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("articles:list", error);
    await logSystemError("articles:list", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar artikel. Silakan coba beberapa saat lagi." },
      { status: 500 }
    );
  }
}
