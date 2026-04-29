import { dayName, toIsoDate } from "@/lib/articles/date";
import type { NormalizedWeather } from "@/lib/articles/types";
import { findLocationGroup } from "@/data/locationGroups";

export function fallbackWeather(location: string, date = new Date(), reason?: string): NormalizedWeather {
  const group = findLocationGroup(location);
  const areas = group?.representativeLocations ?? [{ name: location, adm4Code: "sample" }];
  const isJakarta = location.toLowerCase().includes("jakarta");
  const conditionA = isJakarta ? "cerah berawan" : "hujan ringan";
  const conditionB = location.toLowerCase().includes("selatan") ? "hujan sedang" : "berawan tebal";
  const completenessNote = reason ?? "Data contoh dipakai karena BMKG belum dapat diakses saat proses seed.";

  return {
    source: "BMKG",
    source_url: process.env.BMKG_SOURCE_URL ?? "https://cuaca.bmkg.go.id/",
    fetched_at: new Date().toISOString(),
    publication_location: location,
    location_type: "location_group",
    date: toIsoDate(date),
    day_name: dayName(date),
    main_condition: isJakarta ? "cerah hingga hujan ringan" : "hujan ringan",
    dominant_condition: isJakarta ? "cerah berawan" : "hujan ringan",
    rain_intensity_summary: isJakarta ? "hujan ringan" : "hujan ringan hingga sedang",
    risk_signals: location.toLowerCase().includes("bogor")
      ? ["Potensi hujan sore hari pada sebagian wilayah."]
      : [],
    temperature_min: isJakarta ? 24 : 23,
    temperature_max: isJakarta ? 31 : 33,
    humidity_min: isJakarta ? 67 : 68,
    humidity_max: isJakarta ? 94 : 98,
    wind_speed_min: 8,
    wind_speed_max: 24,
    representative_locations: areas.map((area, index) => ({
      name: area.name,
      adm4_code: area.adm4Code,
      source_url: `${process.env.BMKG_BASE_URL ?? "https://api.bmkg.go.id/publik/prakiraan-cuaca"}?adm4=${area.adm4Code}`,
      condition: index % 3 === 0 && !isJakarta ? conditionB : conditionA,
      rain_intensity: index % 3 === 0 && !isJakarta ? "sedang" : conditionA.includes("hujan") ? "ringan" : null,
      temperature_min: isJakarta ? 24 : index % 2 === 0 ? 24 : 23,
      temperature_max: isJakarta ? 31 : index % 2 === 0 ? 33 : 32,
      humidity_min: isJakarta ? 67 : 68,
      humidity_max: isJakarta ? 94 : 98,
      wind_speed_min: 8,
      wind_speed_max: 24
    })),
    area_breakdown: areas.map((area, index) => ({
      area_name: area.name,
      condition: index % 3 === 0 && !isJakarta ? conditionB : conditionA,
      rain_intensity: index % 3 === 0 && !isJakarta ? "sedang" : conditionA.includes("hujan") ? "ringan" : null,
      temperature_min: isJakarta ? 24 : index % 2 === 0 ? 24 : 23,
      temperature_max: isJakarta ? 31 : index % 2 === 0 ? 33 : 32,
      humidity_min: isJakarta ? 67 : 68,
      humidity_max: isJakarta ? 94 : 98,
      wind_speed_min: 8,
      wind_speed_max: 24
    })),
    time_segments: [
      {
        label: "pagi",
        start_time: "06:00",
        end_time: "10:59",
        dominant_condition: isJakarta ? "cerah berawan" : "berawan",
        rain_intensity: null,
        affected_areas: areas.slice(0, 2).map((area) => area.name),
        temperature_min: 24,
        temperature_max: 28,
        humidity_min: 78,
        humidity_max: 92,
        wind_speed_min: 8,
        wind_speed_max: 18
      },
      {
        label: "siang",
        start_time: "11:00",
        end_time: "14:59",
        dominant_condition: isJakarta ? "berawan tebal" : "hujan ringan",
        rain_intensity: isJakarta ? null : "ringan",
        affected_areas: areas.map((area) => area.name),
        temperature_min: 29,
        temperature_max: 33,
        humidity_min: 68,
        humidity_max: 82,
        wind_speed_min: 10,
        wind_speed_max: 24
      },
      {
        label: "sore",
        start_time: "15:00",
        end_time: "18:59",
        dominant_condition: "hujan ringan",
        rain_intensity: "ringan",
        affected_areas: areas.map((area) => area.name),
        temperature_min: 27,
        temperature_max: 30,
        humidity_min: 78,
        humidity_max: 92,
        wind_speed_min: 8,
        wind_speed_max: 20
      },
      {
        label: "malam",
        start_time: "19:00",
        end_time: "23:59",
        dominant_condition: "berawan",
        rain_intensity: null,
        affected_areas: areas.map((area) => area.name),
        temperature_min: 24,
        temperature_max: 27,
        humidity_min: 84,
        humidity_max: 98,
        wind_speed_min: 6,
        wind_speed_max: 14
      }
    ],
    data_completeness: {
      representative_location_count: areas.length,
      minimum_required_location_count: 3,
      is_complete: true,
      missing_fields: [],
      notes: completenessNote
    },
    source_mode: "fallback_sample",
    aggregation_notes: [completenessNote]
  };
}
