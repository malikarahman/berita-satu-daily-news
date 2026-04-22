import { compactIndonesianDate, longIndonesianDate } from "@/lib/articles/date";
import { selectTemplate } from "@/lib/articles/templateSelector";
import type { GeneratedArticle, NormalizedWeather, TemplatePreference, WeatherArea } from "@/lib/articles/types";

function cap(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function listNames(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} dan ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, dan ${items[items.length - 1]}`;
}

function range(min: number | null, max: number | null, unit: string) {
  if (min === null && max === null) return `data ${unit} belum tersedia`;
  if (min === max || max === null) return `${min} ${unit}`;
  if (min === null) return `${max} ${unit}`;
  return `${min} hingga ${max} ${unit}`;
}

function cityDateline(location: string) {
  if (location.toLowerCase().includes("jakarta")) return "Jakarta, Beritasatu.com";
  return `${location.toUpperCase()}`;
}

function groupAreasByCondition(areas: WeatherArea[]) {
  const map = new Map<string, WeatherArea[]>();
  areas.forEach((area) => {
    const existing = map.get(area.condition) ?? [];
    existing.push(area);
    map.set(area.condition, existing);
  });
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
}

function chunkAreas(areas: WeatherArea[]) {
  const midpoint = Math.ceil(areas.length / 2);
  return [areas.slice(0, midpoint), areas.slice(midpoint)].filter((chunk) => chunk.length);
}

function buildPreview(body: string) {
  return body.split("\n\n")[0].replace(/^.+?–\s*/, "").slice(0, 260);
}

function title(weather: NormalizedWeather) {
  const date = new Date(`${weather.date}T00:00:00`);
  return `[CUACA] ${weather.location} - ${longIndonesianDate(date)}`;
}

function templateOne(weather: NormalizedWeather) {
  const date = new Date(`${weather.date}T00:00:00`);
  const groups = groupAreasByCondition(weather.areas);
  const first = groups[0];
  const second = groups[1];
  const firstAreas = first?.[1] ?? weather.areas;
  const secondAreas = second?.[1] ?? [];

  const paragraphOne = `${cityDateline(weather.location)}– Cuaca di wilayah ${weather.location} pada ${compactIndonesianDate(date)} diperkirakan didominasi ${weather.main_condition} di sejumlah kecamatan.`;

  const paragraphTwo = `Berdasarkan data prakiraan cuaca BMKG, wilayah ${listNames(firstAreas.map((area) => area.name))} diprediksi mengalami ${first?.[0] ?? weather.main_condition} dengan suhu berkisar antara ${range(weather.temperature_min, weather.temperature_max, "derajat Celsius")} serta tingkat kelembapan udara mencapai ${range(weather.humidity_min, weather.humidity_max, "persen")}.`;

  const paragraphThree = secondAreas.length
    ? `Sementara itu, ${second?.[0]} diperkirakan terjadi di ${listNames(secondAreas.map((area) => area.name))}. Suhu udara di wilayah tersebut berada pada kisaran ${range(secondAreas[0].temperature_min, secondAreas[0].temperature_max, "derajat Celsius")} dengan kelembapan antara ${range(secondAreas[0].humidity_min, secondAreas[0].humidity_max, "persen")}.`
    : `Editor tetap perlu memantau perubahan prakiraan terbaru BMKG karena kondisi cuaca dapat berubah mengikuti dinamika atmosfer harian.`;

  return [paragraphOne, paragraphTwo, paragraphThree].join("\n\n");
}

function templateTwo(weather: NormalizedWeather) {
  const date = new Date(`${weather.date}T00:00:00`);
  const [first, second] = weather.areas;
  const timeSentence = weather.time_segments
    .map((segment) => `pada ${segment.label} hari ${segment.condition}`)
    .join(", ");

  const paragraphOne = `${cityDateline(weather.location)} – Kondisi cuaca di wilayah ${weather.location} pada hari ini, ${longIndonesianDate(date)}, umumnya akan ${weather.main_condition}. Perubahan cuaca pada beberapa periode hari tetap perlu diperhatikan.`;

  const paragraphTwo = `Berdasarkan data Badan Meteorologi, Klimatologi, dan Geofisika (BMKG), suhu udara di ${weather.location} pada hari ini berkisar antara ${range(weather.temperature_min, weather.temperature_max, "derajat celsius")} dengan kelembapan ${range(weather.humidity_min, weather.humidity_max, "persen")}.`;

  const areaText = first && second ? `Di wilayah ${first.name} dan ${second.name}` : `Di wilayah ${weather.location}`;
  const paragraphThree = `${areaText}, ${timeSentence}. Prakiraan ini dapat menjadi acuan awal redaksi sebelum naskah disetujui editor.`;

  return [paragraphOne, paragraphTwo, paragraphThree].join("\n\n");
}

function templateThree(weather: NormalizedWeather) {
  const date = new Date(`${weather.date}T00:00:00`);
  const chunks = chunkAreas(weather.areas);
  const first = chunks[0] ?? weather.areas;
  const second = chunks[1] ?? [];

  const paragraphOne = `${cityDateline(weather.location)}– Cuaca di wilayah ${weather.location} pada ${longIndonesianDate(date)} diperkirakan didominasi ${weather.main_condition} yang relatif merata di sejumlah kecamatan.`;

  const paragraphTwo = `Wilayah ${listNames(first.map((area) => area.name))} diprediksi mengalami ${weather.main_condition} dengan suhu berkisar antara ${range(weather.temperature_min, weather.temperature_max, "derajat Celsius")} serta tingkat kelembapan antara ${range(weather.humidity_min, weather.humidity_max, "persen")}.`;

  const paragraphThree = second.length
    ? `Sementara itu, kawasan ${listNames(second.map((area) => area.name))} juga berpotensi mengalami kondisi serupa. Warga diimbau tetap memperhatikan pembaruan informasi cuaca dari BMKG, terutama menjelang aktivitas luar ruang.`
    : `Warga diimbau tetap memperhatikan pembaruan informasi cuaca dari BMKG, terutama menjelang aktivitas luar ruang.`;

  return [paragraphOne, paragraphTwo, paragraphThree].join("\n\n");
}

export function generateArticle(weather: NormalizedWeather, preference: TemplatePreference = "Auto"): GeneratedArticle {
  const templateUsed = selectTemplate(weather, preference);
  const bodyText =
    templateUsed === "Template 1"
      ? templateOne(weather)
      : templateUsed === "Template 2"
        ? templateTwo(weather)
        : templateThree(weather);

  return {
    templateUsed,
    title: title(weather),
    previewText: buildPreview(bodyText),
    bodyText: bodyText.replace(/celsius/g, "Celsius").replace(/bmkg/g, "BMKG").replace(/\b\w/g, (char) => char)
  };
}

export function articleSummaryLabel(weather: NormalizedWeather) {
  return `${cap(weather.main_condition)}; suhu ${range(weather.temperature_min, weather.temperature_max, "C")}; kelembapan ${range(weather.humidity_min, weather.humidity_max, "%")}`;
}
