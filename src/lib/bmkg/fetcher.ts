import { dayName, toIsoDate } from "@/lib/articles/date";
import type {
  CoverageType,
  NormalizedWeather,
  RepresentativeLocationWeather,
  WeatherArea,
  WeatherTimeSegment
} from "@/lib/articles/types";
import { findLocationGroup, type LocationGroupConfig, type RepresentativeLocationConfig } from "@/data/locationGroups";

type BmkgForecast = {
  local_datetime?: string;
  datetime?: string;
  t?: number | string;
  hu?: number | string;
  ws?: number | string;
  wd?: string;
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

type RawRepresentativeWeather = {
  location: RepresentativeLocationConfig;
  sourceUrl: string;
  forecasts: BmkgForecast[];
};

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const match = String(value).match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const numeric = Number(match[0]);
  return Number.isFinite(numeric) ? numeric : null;
}

function minValue(values: Array<number | null>) {
  const filtered = values.filter((item): item is number => item !== null);
  return filtered.length ? Math.min(...filtered) : null;
}

function maxValue(values: Array<number | null>) {
  const filtered = values.filter((item): item is number => item !== null);
  return filtered.length ? Math.max(...filtered) : null;
}

function mostCommon(values: string[], fallback = "berawan") {
  const counts = new Map<string, number>();
  values
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? fallback;
}

function listUnique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function rainIntensity(condition: string) {
  const lower = condition.toLowerCase();
  if (!lower.includes("hujan")) return null;
  if (lower.includes("sangat lebat") || lower.includes("lebat")) return "lebat";
  if (lower.includes("sedang")) return "sedang";
  if (lower.includes("ringan")) return "ringan";
  return "hujan";
}

function summarizeRainIntensities(areas: WeatherArea[]) {
  const intensities = listUnique(
    areas.map((area) => area.rain_intensity).filter((value): value is string => Boolean(value))
  );
  if (!intensities.length) return null;
  if (intensities.length === 1) return `hujan ${intensities[0]}`;
  return `hujan ${intensities[0]} hingga ${intensities[intensities.length - 1]}`;
}

function buildRiskSignals(conditions: string[]) {
  const joined = conditions.join(" ").toLowerCase();
  const risks: string[] = [];
  if (joined.includes("lebat")) risks.push("Potensi hujan lebat di sejumlah wilayah.");
  if (joined.includes("petir") || joined.includes("guntur")) risks.push("BMKG menunjukkan potensi petir pada sebagian area.");
  if (joined.includes("angin")) risks.push("Perlu kewaspadaan terhadap angin kencang.");
  if (joined.includes("sedang")) risks.push("Potensi hujan sedang di sebagian wilayah.");
  return listUnique(risks);
}

function flattenForecasts(response: BmkgResponse) {
  return response.data?.[0]?.cuaca?.flat().filter(Boolean) ?? [];
}

function forecastDateTime(forecast: BmkgForecast) {
  return forecast.local_datetime ?? forecast.datetime ?? "";
}

function forecastsForDate(forecasts: BmkgForecast[], date: Date) {
  const target = toIsoDate(date);
  const matched = forecasts.filter((item) => forecastDateTime(item).startsWith(target));
  return matched.length ? matched : forecasts.slice(0, 8);
}

function labelForHour(hour: number): WeatherTimeSegment["label"] {
  if (hour < 11) return "pagi";
  if (hour < 15) return "siang";
  if (hour < 19) return "sore";
  return "malam";
}

function segmentWindow(label: WeatherTimeSegment["label"]) {
  switch (label) {
    case "pagi":
      return { start: "06:00", end: "10:59" };
    case "siang":
      return { start: "11:00", end: "14:59" };
    case "sore":
      return { start: "15:00", end: "18:59" };
    default:
      return { start: "19:00", end: "23:59" };
  }
}

async function fetchBmkgAdm4(adm4Code: string, signal: AbortSignal) {
  const baseUrl = process.env.BMKG_BASE_URL ?? "https://api.bmkg.go.id/publik/prakiraan-cuaca";
  const url = `${baseUrl}?adm4=${encodeURIComponent(adm4Code)}`;
  const response = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json",
      "User-Agent": "BeritaSatuCuacaHariIni/1.0"
    },
    next: { revalidate: 900 }
  });

  if (!response.ok) {
    throw new Error(`BMKG returned ${response.status} for ${adm4Code}`);
  }

  return {
    sourceUrl: url,
    payload: (await response.json()) as BmkgResponse
  };
}

function normalizeRepresentativeLocation(result: RawRepresentativeWeather): RepresentativeLocationWeather {
  const conditions = result.forecasts.map((forecast) => forecast.weather_desc?.toLowerCase() ?? "");
  const dominant = mostCommon(conditions);

  return {
    name: result.location.name,
    adm4_code: result.location.adm4Code,
    source_url: result.sourceUrl,
    condition: dominant,
    rain_intensity: rainIntensity(dominant),
    temperature_min: minValue(result.forecasts.map((forecast) => asNumber(forecast.t))),
    temperature_max: maxValue(result.forecasts.map((forecast) => asNumber(forecast.t))),
    humidity_min: minValue(result.forecasts.map((forecast) => asNumber(forecast.hu))),
    humidity_max: maxValue(result.forecasts.map((forecast) => asNumber(forecast.hu))),
    wind_speed_min: minValue(result.forecasts.map((forecast) => asNumber(forecast.ws))),
    wind_speed_max: maxValue(result.forecasts.map((forecast) => asNumber(forecast.ws)))
  };
}

function toAreaBreakdown(location: RepresentativeLocationWeather): WeatherArea {
  return {
    area_name: location.name,
    condition: location.condition,
    rain_intensity: location.rain_intensity,
    temperature_min: location.temperature_min,
    temperature_max: location.temperature_max,
    humidity_min: location.humidity_min,
    humidity_max: location.humidity_max,
    wind_speed_min: location.wind_speed_min,
    wind_speed_max: location.wind_speed_max
  };
}

function normalizeTimeSegments(results: RawRepresentativeWeather[]) {
  const segmentMap = new Map<WeatherTimeSegment["label"], BmkgForecast[]>();
  const areaMap = new Map<WeatherTimeSegment["label"], string[]>();

  results.forEach((result) => {
    result.forecasts.forEach((forecast) => {
      const value = forecastDateTime(forecast);
      const hour = Number(value.slice(11, 13));
      const label = labelForHour(Number.isFinite(hour) ? hour : 7);
      segmentMap.set(label, [...(segmentMap.get(label) ?? []), forecast]);
      areaMap.set(label, [...(areaMap.get(label) ?? []), result.location.name]);
    });
  });

  return (["pagi", "siang", "sore", "malam"] as const)
    .map((label) => {
      const forecasts = segmentMap.get(label) ?? [];
      if (!forecasts.length) return null;
      const dominantCondition = mostCommon(forecasts.map((forecast) => forecast.weather_desc?.toLowerCase() ?? ""));
      const window = segmentWindow(label);
      return {
        label,
        start_time: window.start,
        end_time: window.end,
        dominant_condition: dominantCondition,
        rain_intensity: rainIntensity(dominantCondition),
        affected_areas: listUnique(areaMap.get(label) ?? []),
        temperature_min: minValue(forecasts.map((forecast) => asNumber(forecast.t))),
        temperature_max: maxValue(forecasts.map((forecast) => asNumber(forecast.t))),
        humidity_min: minValue(forecasts.map((forecast) => asNumber(forecast.hu))),
        humidity_max: maxValue(forecasts.map((forecast) => asNumber(forecast.hu))),
        wind_speed_min: minValue(forecasts.map((forecast) => asNumber(forecast.ws))),
        wind_speed_max: maxValue(forecasts.map((forecast) => asNumber(forecast.ws)))
      };
    })
    .filter((item): item is WeatherTimeSegment => Boolean(item));
}

function summarizeMainCondition(areas: WeatherArea[]) {
  const distinct = listUnique(areas.map((area) => area.condition));
  if (!distinct.length) return "berawan";
  if (distinct.length === 1) return distinct[0];
  const rainy = distinct.filter((condition) => condition.includes("hujan"));
  if (rainy.length > 1) return `${rainy[0]} hingga ${rainy[rainy.length - 1]}`;
  if (rainy.length === 1) return `${rainy[0]} di sebagian wilayah`;
  return `${distinct[0]} hingga ${distinct[distinct.length - 1]}`;
}

function inferMissingFields(areas: WeatherArea[]) {
  const missing: string[] = [];
  if (areas.every((area) => area.temperature_min === null && area.temperature_max === null)) {
    missing.push("temperature");
  }
  if (areas.every((area) => area.humidity_min === null && area.humidity_max === null)) {
    missing.push("humidity");
  }
  if (areas.every((area) => area.wind_speed_min === null && area.wind_speed_max === null)) {
    missing.push("wind_speed");
  }
  if (areas.every((area) => area.rain_intensity === null)) {
    missing.push("rain_intensity");
  }
  return missing;
}

function buildCompletenessNote(
  group: LocationGroupConfig,
  successCount: number,
  missingFields: string[],
  failures: string[]
) {
  const minimumRequiredLocationCount = Math.min(3, group.representativeLocations.length);
  const notes: string[] = [];

  if (successCount < minimumRequiredLocationCount) {
    notes.push(`Data mewakili ${successCount} dari minimum ${minimumRequiredLocationCount} lokasi acuan.`);
  }
  if (failures.length) {
    notes.push(`Sebagian lokasi BMKG tidak dapat diambil: ${failures.join("; ")}.`);
  }
  if (missingFields.length) {
    notes.push(`Beberapa metrik tidak tersedia: ${missingFields.join(", ")}.`);
  }

  return {
    representative_location_count: successCount,
    minimum_required_location_count: minimumRequiredLocationCount,
    is_complete: successCount >= minimumRequiredLocationCount && missingFields.length === 0,
    missing_fields: missingFields,
    notes: notes.length ? notes.join(" ") : null
  };
}

function aggregateLocationGroup(group: LocationGroupConfig, date: Date, results: RawRepresentativeWeather[], failures: string[]): NormalizedWeather {
  const representativeLocations = results.map(normalizeRepresentativeLocation);
  const areaBreakdown = representativeLocations.map(toAreaBreakdown);
  const missingFields = inferMissingFields(areaBreakdown);
  const completeness = buildCompletenessNote(group, representativeLocations.length, missingFields, failures);
  const conditions = areaBreakdown.map((area) => area.condition);

  return {
    source: "BMKG",
    source_url: process.env.BMKG_SOURCE_URL ?? "https://cuaca.bmkg.go.id/",
    fetched_at: new Date().toISOString(),
    publication_location: group.publishLocationName,
    location_type: "location_group",
    date: toIsoDate(date),
    day_name: dayName(date),
    main_condition: summarizeMainCondition(areaBreakdown),
    dominant_condition: mostCommon(conditions),
    rain_intensity_summary: summarizeRainIntensities(areaBreakdown),
    risk_signals: buildRiskSignals(conditions),
    temperature_min: minValue(areaBreakdown.map((area) => area.temperature_min)),
    temperature_max: maxValue(areaBreakdown.map((area) => area.temperature_max)),
    humidity_min: minValue(areaBreakdown.map((area) => area.humidity_min)),
    humidity_max: maxValue(areaBreakdown.map((area) => area.humidity_max)),
    wind_speed_min: minValue(areaBreakdown.map((area) => area.wind_speed_min)),
    wind_speed_max: maxValue(areaBreakdown.map((area) => area.wind_speed_max)),
    representative_locations: representativeLocations,
    area_breakdown: areaBreakdown,
    time_segments: normalizeTimeSegments(results),
    data_completeness: completeness,
    source_mode: "live",
    aggregation_notes: completeness.notes ? [completeness.notes] : undefined
  };
}

export function resolveLocationGroup(location: string) {
  const group = findLocationGroup(location);
  if (!group) {
    throw new Error("Lokasi yang dipilih belum tersedia dalam konfigurasi BMKG. Silakan pilih lokasi lain.");
  }
  return group;
}

export async function fetchNormalizedWeather(location: string, date = new Date()): Promise<NormalizedWeather> {
  const group = resolveLocationGroup(location);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const failures: string[] = [];

  try {
    const settled = await Promise.allSettled(
      group.representativeLocations.map(async (representativeLocation) => {
        const { sourceUrl, payload } = await fetchBmkgAdm4(representativeLocation.adm4Code, controller.signal);
        const forecasts = forecastsForDate(flattenForecasts(payload), date);
        if (!forecasts.length) {
          throw new Error("BMKG tidak mengembalikan prakiraan untuk tanggal ini.");
        }
        return {
          location: representativeLocation,
          sourceUrl,
          forecasts
        } satisfies RawRepresentativeWeather;
      })
    );

    const successful = settled
      .map((result, index) => {
        if (result.status === "rejected") {
          failures.push(
            `${group.representativeLocations[index].name}: ${result.reason instanceof Error ? result.reason.message : "gagal diambil"}`
          );
          return null;
        }
        return result.value;
      })
      .filter((item): item is RawRepresentativeWeather => Boolean(item));

    if (!successful.length) {
      throw new Error("BMKG weather data is currently unavailable for this location. Please try again later.");
    }

    return aggregateLocationGroup(group, date, successful, failures);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Gagal mengambil data BMKG.");
  } finally {
    clearTimeout(timeout);
  }
}

function weatherAreaFromNormalized(weather: NormalizedWeather, areaName = weather.publication_location): WeatherArea {
  return {
    area_name: areaName,
    condition: weather.dominant_condition,
    rain_intensity: weather.rain_intensity_summary,
    temperature_min: weather.temperature_min,
    temperature_max: weather.temperature_max,
    humidity_min: weather.humidity_min,
    humidity_max: weather.humidity_max,
    wind_speed_min: weather.wind_speed_min,
    wind_speed_max: weather.wind_speed_max
  };
}

function normalizeAggregateTimeSegments(items: NormalizedWeather[]) {
  return (["pagi", "siang", "sore", "malam"] as const)
    .map((label) => {
      const matching = items
        .map((item) => item.time_segments.find((segment) => segment.label === label))
        .filter((segment): segment is WeatherTimeSegment => Boolean(segment));

      if (!matching.length) return null;
      const window = segmentWindow(label);
      const dominantCondition = mostCommon(matching.map((segment) => segment.dominant_condition));

      return {
        label,
        start_time: window.start,
        end_time: window.end,
        dominant_condition: dominantCondition,
        rain_intensity: rainIntensity(dominantCondition),
        affected_areas: listUnique(matching.flatMap((segment) => segment.affected_areas)),
        temperature_min: minValue(matching.map((segment) => segment.temperature_min)),
        temperature_max: maxValue(matching.map((segment) => segment.temperature_max)),
        humidity_min: minValue(matching.map((segment) => segment.humidity_min)),
        humidity_max: maxValue(matching.map((segment) => segment.humidity_max)),
        wind_speed_min: minValue(matching.map((segment) => segment.wind_speed_min)),
        wind_speed_max: maxValue(matching.map((segment) => segment.wind_speed_max))
      };
    })
    .filter((item): item is WeatherTimeSegment => Boolean(item));
}

export function aggregateNormalizedWeatherSet(input: {
  label: string;
  coverageType: CoverageType;
  date: Date;
  items: NormalizedWeather[];
  selectedRegions?: string[];
  selectedPublicationAreas?: string[];
  failures?: string[];
}) {
  const failures = input.failures ?? [];
  const areaBreakdown = input.items.map((item) => weatherAreaFromNormalized(item));
  const conditions = areaBreakdown.map((area) => area.condition);
  const missingFields = inferMissingFields(areaBreakdown);
  const minimumRequiredLocationCount = Math.min(
    input.coverageType === "all_region" ? 5 : Math.max(1, input.items.length),
    input.coverageType === "multiple_regions" ? Math.max(2, input.items.length) : Math.max(1, input.items.length)
  );
  const notes: string[] = [];

  if (input.items.length < minimumRequiredLocationCount) {
    notes.push(`Data mewakili ${input.items.length} dari target ${minimumRequiredLocationCount} cakupan publikasi.`);
  }
  if (failures.length) {
    notes.push(`Sebagian cakupan BMKG tidak dapat diambil: ${failures.join("; ")}.`);
  }
  if (missingFields.length) {
    notes.push(`Beberapa metrik tidak tersedia: ${missingFields.join(", ")}.`);
  }

  return {
    source: "BMKG" as const,
    source_url: process.env.BMKG_SOURCE_URL ?? "https://cuaca.bmkg.go.id/",
    fetched_at: new Date().toISOString(),
    publication_location: input.label,
    location_type: "coverage_group" as const,
    date: toIsoDate(input.date),
    day_name: dayName(input.date),
    main_condition: summarizeMainCondition(areaBreakdown),
    dominant_condition: mostCommon(conditions),
    rain_intensity_summary: summarizeRainIntensities(areaBreakdown),
    risk_signals: listUnique(input.items.flatMap((item) => item.risk_signals)),
    temperature_min: minValue(input.items.map((item) => item.temperature_min)),
    temperature_max: maxValue(input.items.map((item) => item.temperature_max)),
    humidity_min: minValue(input.items.map((item) => item.humidity_min)),
    humidity_max: maxValue(input.items.map((item) => item.humidity_max)),
    wind_speed_min: minValue(input.items.map((item) => item.wind_speed_min)),
    wind_speed_max: maxValue(input.items.map((item) => item.wind_speed_max)),
    representative_locations: input.items.flatMap((item) => item.representative_locations),
    area_breakdown: areaBreakdown,
    time_segments: normalizeAggregateTimeSegments(input.items),
    data_completeness: {
      representative_location_count: input.items.reduce(
        (total, item) => total + item.data_completeness.representative_location_count,
        0
      ),
      minimum_required_location_count: input.items.reduce(
        (total, item) => total + item.data_completeness.minimum_required_location_count,
        0
      ),
      is_complete: failures.length === 0 && missingFields.length === 0,
      missing_fields: missingFields,
      notes: notes.length ? notes.join(" ") : null
    },
    source_mode: input.items.every((item) => item.source_mode === "live") ? "live" : "fallback_sample",
    coverage_type: input.coverageType,
    selected_region_groups: input.selectedRegions,
    selected_publication_areas: input.selectedPublicationAreas,
    publication_area_count: input.selectedPublicationAreas?.length ?? input.items.length,
    aggregation_notes: notes.length ? notes : undefined
  } satisfies NormalizedWeather;
}
