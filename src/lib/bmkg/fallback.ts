import { dayName, toIsoDate } from "@/lib/articles/date";
import type { NormalizedWeather } from "@/lib/articles/types";

const DEFAULT_AREA_SETS: Record<string, string[]> = {
  Jakarta: ["Jakarta Pusat", "Jakarta Timur", "Jakarta Selatan", "Jakarta Barat", "Jakarta Utara"],
  "Tangerang Selatan": [
    "Serpong",
    "Serpong Utara",
    "Pondok Aren",
    "Pamulang",
    "Setu",
    "Ciputat",
    "Ciputat Timur"
  ],
  Depok: ["Beji", "Cimanggis", "Pancoran Mas", "Sukmajaya"],
  Bekasi: ["Bekasi Timur", "Bekasi Barat", "Bekasi Selatan", "Bekasi Utara"],
  Bogor: ["Bogor Tengah", "Bogor Barat", "Bogor Selatan", "Bogor Timur"]
};

export function fallbackWeather(location: string, date = new Date(), reason?: string): NormalizedWeather {
  const areas = DEFAULT_AREA_SETS[location] ?? [location];
  const isJakarta = location.toLowerCase().includes("jakarta");
  const conditionA = isJakarta ? "cerah berawan" : "hujan ringan";
  const conditionB = location === "Tangerang Selatan" ? "hujan sedang" : "berawan tebal";

  return {
    source: "BMKG",
    source_url: process.env.BMKG_SOURCE_URL ?? "https://cuaca.bmkg.go.id/",
    location,
    date: toIsoDate(date),
    day_name: dayName(date),
    main_condition: isJakarta ? "cerah hingga hujan ringan" : "hujan ringan",
    temperature_min: isJakarta ? 24 : 23,
    temperature_max: isJakarta ? 31 : 33,
    humidity_min: isJakarta ? 67 : 68,
    humidity_max: isJakarta ? 94 : 98,
    areas: areas.map((name, index) => ({
      name,
      condition: index % 3 === 0 && !isJakarta ? conditionB : conditionA,
      temperature_min: isJakarta ? 24 : index % 2 === 0 ? 24 : 23,
      temperature_max: isJakarta ? 31 : index % 2 === 0 ? 33 : 32,
      humidity_min: isJakarta ? 67 : 68,
      humidity_max: isJakarta ? 94 : 98
    })),
    time_segments: [
      { label: "pagi", condition: isJakarta ? "cerah berawan" : "berawan", temperature: 25, humidity: 86 },
      { label: "siang", condition: isJakarta ? "berawan tebal" : "hujan ringan", temperature: 31, humidity: 72 },
      { label: "sore", condition: "hujan ringan", temperature: 29, humidity: 82 },
      { label: "malam", condition: "berawan", temperature: 26, humidity: 90 }
    ],
    fetched_at: new Date().toISOString(),
    source_mode: "fallback",
    warnings: reason ? [reason] : ["Menggunakan data contoh karena BMKG tidak dapat diakses."]
  };
}
