import { dayName, toIsoDate } from "@/lib/articles/date";
import type { NormalizedWeather, WeatherArea, WeatherTimeSegment } from "@/lib/articles/types";
import { fallbackWeather } from "@/lib/bmkg/fallback";
import { getLocationConfig } from "@/lib/bmkg/locations";

type BmkgForecast = {
  local_datetime?: string;
  t?: number | string;
  hu?: number | string;
  weather_desc?: string;
};

type BmkgResponse = {
  lokasi?: {
    provinsi?: string;
    kotkab?: string;
    kecamatan?: string;
    desa?: string;
  };
  data?: Array<{
    cuaca?: BmkgForecast[][];
  }>;
};

function asNumber(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function minValue(values: Array<number | null>) {
  const filtered = values.filter((item): item is number => item !== null);
  return filtered.length ? Math.min(...filtered) : null;
}

function maxValue(values: Array<number | null>) {
  const filtered = values.filter((item): item is number => item !== null);
  return filtered.length ? Math.max(...filtered) : null;
}

function mostCommon(values: string[]) {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "berawan";
}

function labelForHour(hour: number): WeatherTimeSegment["label"] {
  if (hour < 11) return "pagi";
  if (hour < 15) return "siang";
  if (hour < 19) return "sore";
  return "malam";
}

async function fetchBmkgAdm4(adm4: string, signal: AbortSignal): Promise<BmkgResponse> {
  const baseUrl = process.env.BMKG_BASE_URL ?? "https://api.bmkg.go.id/publik/prakiraan-cuaca";
  const url = `${baseUrl}?adm4=${encodeURIComponent(adm4)}`;
  const response = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json",
      "User-Agent": "BeritaSatuDailyNews/0.1"
    },
    next: { revalidate: 900 }
  });

  if (!response.ok) {
    throw new Error(`BMKG returned ${response.status} for ${adm4}`);
  }

  return response.json() as Promise<BmkgResponse>;
}

function flattenForecasts(response: BmkgResponse) {
  return response.data?.[0]?.cuaca?.flat().filter(Boolean) ?? [];
}

function forecastsForDate(forecasts: BmkgForecast[], date: Date) {
  const target = toIsoDate(date);
  const matched = forecasts.filter((item) => item.local_datetime?.startsWith(target));
  return matched.length ? matched : forecasts.slice(0, 8);
}

function normalizeArea(areaName: string, forecasts: BmkgForecast[]): WeatherArea {
  const conditions = forecasts.map((item) => item.weather_desc?.toLowerCase() ?? "").filter(Boolean);
  return {
    name: areaName,
    condition: mostCommon(conditions),
    temperature_min: minValue(forecasts.map((item) => asNumber(item.t))),
    temperature_max: maxValue(forecasts.map((item) => asNumber(item.t))),
    humidity_min: minValue(forecasts.map((item) => asNumber(item.hu))),
    humidity_max: maxValue(forecasts.map((item) => asNumber(item.hu)))
  };
}

function normalizeTimeSegments(forecasts: BmkgForecast[]) {
  const segmentMap = new Map<WeatherTimeSegment["label"], BmkgForecast[]>();
  forecasts.forEach((forecast) => {
    const hour = Number(forecast.local_datetime?.slice(11, 13) ?? 0);
    const label = labelForHour(hour);
    const existing = segmentMap.get(label) ?? [];
    existing.push(forecast);
    segmentMap.set(label, existing);
  });

  return (["pagi", "siang", "sore", "malam"] as const)
    .map((label) => {
      const items = segmentMap.get(label) ?? [];
      if (!items.length) return null;
      return {
        label,
        condition: mostCommon(items.map((item) => item.weather_desc?.toLowerCase() ?? "")),
        temperature: asNumber(items[0]?.t),
        humidity: asNumber(items[0]?.hu)
      };
    })
    .filter((item): item is WeatherTimeSegment => Boolean(item));
}

function summarizeMainCondition(areas: WeatherArea[]) {
  const conditions = [...new Set(areas.map((item) => item.condition))];
  const rainy = conditions.filter((condition) => condition.includes("hujan"));
  if (rainy.length > 1) return `${rainy[0]} hingga ${rainy[rainy.length - 1]}`;
  if (rainy.length === 1 && conditions.length > 1) return `${rainy[0]} dan ${conditions.find((item) => item !== rainy[0])}`;
  return conditions[0] ?? "berawan";
}

export async function fetchNormalizedWeather(location: string, date = new Date()): Promise<NormalizedWeather> {
  const config = getLocationConfig(location);
  if (!config) {
    return fallbackWeather(location, date, `Lokasi "${location}" belum dikonfigurasi untuk kode wilayah BMKG.`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const warnings: string[] = [];

  try {
    const areaResults = await Promise.allSettled(
      config.areas.map(async (area) => {
        const response = await fetchBmkgAdm4(area.adm4, controller.signal);
        return {
          areaName: area.areaName,
          forecasts: forecastsForDate(flattenForecasts(response), date)
        };
      })
    );

    const successful = areaResults
      .map((result, index) => {
        if (result.status === "rejected") {
          warnings.push(`${config.areas[index].areaName}: ${result.reason instanceof Error ? result.reason.message : "gagal diambil"}`);
          return null;
        }
        return result.value;
      })
      .filter((item): item is { areaName: string; forecasts: BmkgForecast[] } => Boolean(item?.forecasts.length));

    if (!successful.length) {
      return fallbackWeather(config.name, date, "Semua permintaan BMKG gagal atau tidak memiliki data prakiraan.");
    }

    const areas = successful.map((item) => normalizeArea(item.areaName, item.forecasts));
    const representative = successful[0].forecasts;

    return {
      source: "BMKG",
      source_url: process.env.BMKG_SOURCE_URL ?? "https://cuaca.bmkg.go.id/",
      location: config.name,
      date: toIsoDate(date),
      day_name: dayName(date),
      main_condition: summarizeMainCondition(areas),
      temperature_min: minValue(areas.map((item) => item.temperature_min)),
      temperature_max: maxValue(areas.map((item) => item.temperature_max)),
      humidity_min: minValue(areas.map((item) => item.humidity_min)),
      humidity_max: maxValue(areas.map((item) => item.humidity_max)),
      areas,
      time_segments: normalizeTimeSegments(representative),
      fetched_at: new Date().toISOString(),
      source_mode: "live",
      warnings: warnings.length ? warnings : undefined
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "BMKG fetch failure";
    return fallbackWeather(config.name, date, reason);
  } finally {
    clearTimeout(timeout);
  }
}
