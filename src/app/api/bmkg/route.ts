import { NextRequest, NextResponse } from "next/server";
import { fetchNormalizedWeather } from "@/lib/bmkg/fetcher";
import { configuredLocations } from "@/lib/bmkg/locations";
import { logSystemError } from "@/lib/db/systemLog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const location = request.nextUrl.searchParams.get("location");
    if (!location) {
      return NextResponse.json({ locations: configuredLocations() });
    }

    const date = request.nextUrl.searchParams.get("date");
    const weather = await fetchNormalizedWeather(location, date ? new Date(`${date}T00:00:00`) : new Date());
    return NextResponse.json({ weather });
  } catch (error) {
    console.error("bmkg:fetch", error);
    await logSystemError("bmkg:fetch", error);
    return NextResponse.json(
      { error: "Gagal mengambil atau menormalisasi data BMKG." },
      { status: 500 }
    );
  }
}
