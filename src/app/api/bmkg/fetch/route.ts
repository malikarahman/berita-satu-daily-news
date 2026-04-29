import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchNormalizedWeather } from "@/lib/bmkg/fetcher";
import { logSystemError } from "@/lib/db/systemLog";

export const dynamic = "force-dynamic";

const schema = z.object({
  location: z.string().min(1),
  date: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const weather = await fetchNormalizedWeather(
      body.location,
      body.date ? new Date(`${body.date}T00:00:00`) : new Date()
    );
    return NextResponse.json({ weather });
  } catch (error) {
    await logSystemError("bmkg:fetch-post", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil data BMKG." },
      { status: 500 }
    );
  }
}
