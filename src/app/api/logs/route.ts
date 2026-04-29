import { NextRequest, NextResponse } from "next/server";
import { listLogs } from "@/lib/articles/service";
import { logSystemError } from "@/lib/db/systemLog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const payload = await listLogs(request.nextUrl.searchParams);
    return NextResponse.json(payload);
  } catch (error) {
    await logSystemError("logs:list", error);
    return NextResponse.json(
      { error: "Gagal memuat log sistem." },
      { status: 500 }
    );
  }
}
