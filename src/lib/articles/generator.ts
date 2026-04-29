import { longIndonesianDate } from "@/lib/articles/date";
import { selectTemplate } from "@/lib/articles/templateSelector";
import type {
  ConcreteTemplate,
  GeneratedArticle,
  NormalizedWeather,
  TemplatePreference,
  WeatherArea
} from "@/lib/articles/types";

function pickVariant(seed: string, variants: string[]) {
  const total = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return variants[total % variants.length];
}

function titleCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function sentenceCase(value: string) {
  return titleCase(value.toLowerCase());
}

function listNames(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} dan ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, dan ${items[items.length - 1]}`;
}

function formatRange(min: number | null, max: number | null, unit: string) {
  if (min === null && max === null) return "";
  if (min !== null && max !== null) {
    return `${min} hingga ${max} ${unit}`;
  }
  return `${min ?? max} ${unit}`;
}

function metricsSentence(weather: NormalizedWeather) {
  const pieces: string[] = [];
  const temperature = formatRange(weather.temperature_min, weather.temperature_max, "derajat Celsius");
  const humidity = formatRange(weather.humidity_min, weather.humidity_max, "persen");
  const wind = formatRange(weather.wind_speed_min, weather.wind_speed_max, "km per jam");

  if (temperature) pieces.push(`suhu udara ${temperature}`);
  if (humidity) pieces.push(`kelembapan ${humidity}`);
  if (wind) pieces.push(`kecepatan angin ${wind}`);

  if (!pieces.length) return "BMKG belum merinci metrik tambahan dalam prakiraan terbaru.";
  if (pieces.length === 1) return `BMKG mencatat ${pieces[0]}.`;
  return `BMKG mencatat ${pieces.slice(0, -1).join(", ")}, serta ${pieces[pieces.length - 1]}.`;
}

function buildPreview(bodyText: string) {
  return bodyText.split("\n\n")[0].replace(/^.+?[-–]\s*/, "").trim().slice(0, 280);
}

function groupsByCondition(areas: WeatherArea[]) {
  const map = new Map<string, WeatherArea[]>();
  areas.forEach((area) => {
    const key = area.condition;
    map.set(key, [...(map.get(key) ?? []), area]);
  });
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
}

function dateline(weather: NormalizedWeather) {
  return weather.coverage_type === "multiple_regions" ||
    weather.coverage_type === "all_region" ||
    weather.publication_location.toLowerCase().includes("jakarta")
    ? "Jakarta, Beritasatu.com"
    : weather.publication_location.toUpperCase();
}

function areaSummary(area: WeatherArea) {
  const metrics: string[] = [];
  const temp = formatRange(area.temperature_min, area.temperature_max, "derajat Celsius");
  const humidity = formatRange(area.humidity_min, area.humidity_max, "persen");
  const wind = formatRange(area.wind_speed_min, area.wind_speed_max, "km per jam");
  if (temp) metrics.push(`suhu ${temp}`);
  if (humidity) metrics.push(`kelembapan ${humidity}`);
  if (wind) metrics.push(`angin ${wind}`);
  return `${area.area_name} diperkirakan ${area.condition}${metrics.length ? ` dengan ${metrics.join(", ")}` : ""}`;
}

function timeSummary(weather: NormalizedWeather) {
  return weather.time_segments
    .map((segment) => {
      const areaText =
        segment.affected_areas.length && segment.affected_areas.length < weather.area_breakdown.length
          ? ` di ${listNames(segment.affected_areas)}`
          : "";
      return `${segment.label} hari ${segment.dominant_condition}${areaText}`;
    })
    .join(", ");
}

function warningSentence(weather: NormalizedWeather) {
  if (!weather.risk_signals.length) return "";
  return weather.risk_signals.join(" ");
}

function bmkgAttribution(weather: NormalizedWeather) {
  return `Prakiraan ini mengacu pada data Badan Meteorologi, Klimatologi, dan Geofisika (BMKG) untuk ${weather.publication_location}.`;
}

function cautionSentence(weather: NormalizedWeather) {
  if (weather.risk_signals.length) {
    return "Masyarakat diimbau waspada terhadap perubahan cuaca cepat, terutama saat beraktivitas di luar ruangan.";
  }
  if (weather.main_condition.includes("hujan")) {
    return "Warga dapat menyiapkan perlengkapan hujan dan memantau pembaruan cuaca BMKG sepanjang hari.";
  }
  return "Pembaca tetap disarankan memantau pembaruan BMKG karena kondisi cuaca dapat berubah sewaktu-waktu.";
}

function titleForTemplate(weather: NormalizedWeather, template: ConcreteTemplate) {
  const date = new Date(`${weather.date}T00:00:00`);
  const dateText = longIndonesianDate(date);
  const location = weather.publication_location;
  const condition = sentenceCase(weather.main_condition);
  const lead = pickVariant(`${location}-${template}`, {
    "Template 1": [
      `Waspada ${condition} di ${location}, Simak Prakiraan Cuaca ${dateText}`,
      `BMKG Ingatkan Potensi ${condition} di ${location} pada ${dateText}`
    ],
    "Template 2": [
      `Prakiraan Cuaca ${location} ${dateText}, Wilayah Mana Saja Berpotensi Hujan?`,
      `Cuaca ${location} ${dateText}: Simak Sebaran Kondisi per Wilayah`
    ],
    "Template 3": [
      `Cuaca ${location} ${dateText}: Perubahan Kondisi dari Pagi hingga Malam`,
      `Prakiraan Cuaca ${location} ${dateText}, Cek Pergeseran Cuaca Tiap Waktu`
    ],
    "Template 4": [
      `Prakiraan Cuaca ${location} ${dateText}, Beberapa Area Tunjukkan Pola Berbeda`,
      `Cuaca ${location} ${dateText}: BMKG Petakan Kondisi di Sejumlah Area`
    ],
    "Template 5": [
      `BMKG Minta Waspada, ${location} Berpotensi ${weather.rain_intensity_summary ?? weather.main_condition}`,
      `${location} Diprakirakan Alami Perubahan Cuaca, BMKG Soroti Area Rawan`
    ],
    "Template 6": [
      `Cuaca ${location} ${dateText}: Rincian Pagi, Siang, Sore, hingga Malam`,
      `Prakiraan Cuaca ${location} ${dateText}, Lengkap dengan Suhu dan Kelembapan`
    ],
    "Template 7": [
      `BMKG Keluarkan Penekanan Cuaca untuk ${location}, Ini Rangkuman Prakiraannya`,
      `Cuaca ${location} ${dateText}: BMKG Soroti Risiko yang Perlu Diwaspadai`
    ],
    "Template 8": [
      `Pagi Cenderung Tenang, ${location} Berpotensi Diguyur Hujan Belakangan Hari`,
      `Cuaca ${location} ${dateText}: Cerah Berawan di Awal, Hujan Berpeluang Muncul Kemudian`
    ],
    "Template 9": [
      `Cuaca ${location} ${dateText}: Ringkasan Perubahan Cuaca Sepanjang Hari`,
      `Prakiraan Singkat Cuaca ${location} ${dateText}, Cek Waktu Potensi Hujan`
    ],
    "Template 10": [
      `Cuaca ${location} ${dateText} Cenderung Seragam di Sejumlah Area`,
      `Prakiraan Cuaca ${location} ${dateText}, Kondisi Relatif Merata`
    ],
    "Template 11": [
      `Prakiraan Cuaca ${location}: Hujan Ringan hingga Sedang Berpeluang Muncul di Sejumlah Area`,
      `Cuaca ${location} ${dateText}: Sebagian Wilayah Berpotensi Diguyur Hujan dengan Intensitas Berbeda`
    ],
    "Template 12": [
      `Cuaca ${location} ${dateText}: Umumnya Cerah hingga Berawan, Hujan Ringan Masih Berpeluang`,
      `Prakiraan Cuaca ${location} ${dateText}, Hujan Ringan Diperkirakan Turun di Sejumlah Area`
    ],
    "Template 13": [
      `Cuaca ${location} ${dateText} Didominasi Kondisi yang Relatif Merata`,
      `Prakiraan Cuaca ${location}: BMKG Prediksi Kondisi Serupa di Sejumlah Kecamatan`
    ]
  }[template]);

  return lead;
}

function templateOne(weather: NormalizedWeather) {
  const groups = groupsByCondition(weather.area_breakdown);
  const firstGroup = groups[0];
  const secondGroup = groups[1];
  return [
    `${dateline(weather)} - BMKG memprakirakan cuaca di ${weather.publication_location} pada ${longIndonesianDate(
      new Date(`${weather.date}T00:00:00`)
    )} perlu diwaspadai karena pola cuaca menunjukkan ${weather.main_condition}. ${warningSentence(weather)}`,
    firstGroup
      ? `Kelompok wilayah ${listNames(firstGroup[1].map((area) => area.area_name))} diprediksi mengalami ${firstGroup[0]} dengan ${metricsSentence(
          weather
        ).replace(/^BMKG mencatat /, "")}`
      : metricsSentence(weather),
    secondGroup
      ? `Sementara itu, ${secondGroup[0]} juga berpeluang muncul di ${listNames(
          secondGroup[1].map((area) => area.area_name)
        )}. Redaksi perlu memberi perhatian ekstra pada pergeseran intensitas hujan antarkawasan.`
      : `Sebaran cuaca cenderung seragam, namun masyarakat tetap perlu memantau pembaruan BMKG pada jam-jam berikutnya.`,
    `${bmkgAttribution(weather)} ${cautionSentence(weather)}`
  ].join("\n\n");
}

function templateTwo(weather: NormalizedWeather) {
  return [
    `${dateline(weather)} - Kondisi cuaca di ${weather.publication_location} pada ${longIndonesianDate(
      new Date(`${weather.date}T00:00:00`)
    )} diperkirakan bergerak dalam pola ${weather.main_condition} dengan perbedaan tipis di sejumlah area.`,
    `Berdasarkan data Badan Meteorologi, Klimatologi, dan Geofisika (BMKG), ${metricsSentence(weather).toLowerCase()}`,
    `${weather.area_breakdown
      .slice(0, 3)
      .map((area) => areaSummary(area))
      .join(". ")}.`,
    `${weather.area_breakdown.length > 3 ? `Wilayah lain seperti ${listNames(weather.area_breakdown.slice(3).map((area) => area.area_name))} juga masuk dalam pantauan BMKG.` : ""} ${cautionSentence(weather)}`
      .trim()
  ].join("\n\n");
}

function templateThree(weather: NormalizedWeather) {
  return [
    `${dateline(weather)} - Prakiraan cuaca BMKG untuk ${weather.publication_location} pada ${longIndonesianDate(
      new Date(`${weather.date}T00:00:00`)
    )} menunjukkan perubahan kondisi sepanjang hari dengan kecenderungan ${weather.main_condition}.`,
    `Secara umum, ${timeSummary(weather)}.`,
    metricsSentence(weather),
    `${bmkgAttribution(weather)} ${cautionSentence(weather)}`
  ].join("\n\n");
}

function templateFour(weather: NormalizedWeather) {
  const firstHalf = weather.area_breakdown.slice(0, Math.ceil(weather.area_breakdown.length / 2));
  const secondHalf = weather.area_breakdown.slice(Math.ceil(weather.area_breakdown.length / 2));
  return [
    `${dateline(weather)} - BMKG memetakan cuaca ${weather.publication_location} ke dalam beberapa kantong wilayah pada ${longIndonesianDate(
      new Date(`${weather.date}T00:00:00`)
    )}, dengan pola umum ${weather.main_condition}.`,
    `${listNames(firstHalf.map((area) => area.area_name))} menjadi kelompok pertama yang diprakirakan ${firstHalf
      .map((area) => area.condition)
      .filter((value, index, all) => all.indexOf(value) === index)
      .join(", ")}.`,
    secondHalf.length
      ? `Adapun ${listNames(secondHalf.map((area) => area.area_name))} memperlihatkan variasi ${secondHalf
          .map((area) => area.condition)
          .filter((value, index, all) => all.indexOf(value) === index)
          .join(", ")}.`
      : metricsSentence(weather),
    `${metricsSentence(weather)} ${bmkgAttribution(weather)}`
  ].join("\n\n");
}

function templateFive(weather: NormalizedWeather) {
  return [
    `${dateline(weather)} - Cuaca ${weather.publication_location} pada ${longIndonesianDate(
      new Date(`${weather.date}T00:00:00`)
    )} diprakirakan berubah dari satu periode ke periode lain dengan peluang ${weather.rain_intensity_summary ?? weather.main_condition}.`,
    `${warningSentence(weather) || "BMKG meminta masyarakat dan redaksi tetap mewaspadai perubahan cuaca lokal."}`,
    `${weather.area_breakdown
      .slice(0, 4)
      .map((area) => `${area.area_name} berpotensi ${area.condition}`)
      .join(", ")}.`,
    `${timeSummary(weather)}. ${cautionSentence(weather)}`
  ].join("\n\n");
}

function templateSix(weather: NormalizedWeather) {
  return [
    `${dateline(weather)} - Prakiraan cuaca ${weather.publication_location} pada ${longIndonesianDate(
      new Date(`${weather.date}T00:00:00`)
    )} dapat dibaca secara kronologis dari pagi hingga malam.`,
    weather.time_segments
      .map((segment) => {
        const metrics: string[] = [];
        const temp = formatRange(segment.temperature_min, segment.temperature_max, "derajat Celsius");
        const humidity = formatRange(segment.humidity_min, segment.humidity_max, "persen");
        if (temp) metrics.push(`suhu ${temp}`);
        if (humidity) metrics.push(`kelembapan ${humidity}`);
        return `Pada ${segment.label} hari, cuaca ${segment.dominant_condition}${metrics.length ? ` dengan ${metrics.join(" dan ")}` : ""}.`;
      })
      .join(" "),
    `Secara wilayah, ${listNames(weather.area_breakdown.map((area) => area.area_name))} menjadi area representatif yang dipakai untuk menyusun naskah ini.`,
    `${bmkgAttribution(weather)} ${cautionSentence(weather)}`
  ].join("\n\n");
}

function templateSeven(weather: NormalizedWeather) {
  return [
    `${dateline(weather)} - BMKG menekankan potensi cuaca yang perlu dicermati di ${weather.publication_location} pada ${longIndonesianDate(
      new Date(`${weather.date}T00:00:00`)
    )}. Prakiraan terbaru menunjukkan ${weather.main_condition}.`,
    `${warningSentence(weather) || "Peringatan utama BMKG diarahkan pada perubahan cuaca yang dapat berkembang cepat."}`,
    `Area yang paling perlu dipantau meliputi ${listNames(
      weather.area_breakdown.slice(0, 4).map((area) => area.area_name)
    )}, dengan rentang ${formatRange(weather.temperature_min, weather.temperature_max, "derajat Celsius")} dan kelembapan ${formatRange(
      weather.humidity_min,
      weather.humidity_max,
      "persen"
    )}.`,
    `${bmkgAttribution(weather)} ${cautionSentence(weather)}`
  ].join("\n\n");
}

function templateEight(weather: NormalizedWeather) {
  const early = weather.time_segments.find((segment) => segment.label === "pagi");
  const later = weather.time_segments.find((segment) => segment.label === "sore") ?? weather.time_segments.find((segment) => segment.label === "siang");
  return [
    `${dateline(weather)} - Cuaca di ${weather.publication_location} pada ${longIndonesianDate(
      new Date(`${weather.date}T00:00:00`)
    )} cenderung memulai hari dalam kondisi ${early?.dominant_condition ?? "relatif tenang"} sebelum bergerak ke pola ${later?.dominant_condition ?? weather.main_condition}.`,
    `BMKG mencatat bahwa perubahan cuaca tersebut masih berada dalam rentang ${weather.main_condition}, sehingga redaksi dapat menyiapkan judul yang menekankan pergeseran kondisi harian.`,
    `${weather.area_breakdown
      .slice(0, 3)
      .map((area) => `${area.area_name} berpotensi ${area.condition}`)
      .join(", ")}.`,
    `${bmkgAttribution(weather)} ${cautionSentence(weather)}`
  ].join("\n\n");
}

function templateNine(weather: NormalizedWeather) {
  return [
    `${dateline(weather)} - BMKG memprakirakan cuaca ${weather.publication_location} pada ${longIndonesianDate(
      new Date(`${weather.date}T00:00:00`)
    )} bergerak dalam pola ${weather.main_condition}.`,
    `${timeSummary(weather)}.`,
    `${metricsSentence(weather)} ${bmkgAttribution(weather)}`
  ].join("\n\n");
}

function templateTen(weather: NormalizedWeather) {
  return [
    `${dateline(weather)} - Cuaca di ${weather.publication_location} pada ${longIndonesianDate(
      new Date(`${weather.date}T00:00:00`)
    )} diperkirakan relatif seragam dengan dominasi ${weather.dominant_condition}.`,
    `Wilayah ${listNames(weather.area_breakdown.map((area) => area.area_name))} menunjukkan kecenderungan yang sejalan, sehingga naskah dapat menonjolkan kondisi cuaca yang merata.`,
    metricsSentence(weather),
    `${bmkgAttribution(weather)} ${cautionSentence(weather)}`
  ].join("\n\n");
}

function templateEleven(weather: NormalizedWeather) {
  const groups = groupsByCondition(weather.area_breakdown);
  const first = groups[0];
  const second = groups[1];
  return [
    `${dateline(weather)} - Cuaca di wilayah ${weather.publication_location} diperkirakan didominasi ${weather.rain_intensity_summary ?? weather.main_condition} di sejumlah area pada ${longIndonesianDate(
      new Date(`${weather.date}T00:00:00`)
    )}.`,
    first
      ? `Berdasarkan data prakiraan cuaca, wilayah ${listNames(first[1].map((area) => area.area_name))} diprediksi mengalami ${first[0]} dengan ${formatRange(
          weather.temperature_min,
          weather.temperature_max,
          "derajat Celsius"
        )} dan kelembapan ${formatRange(weather.humidity_min, weather.humidity_max, "persen")}.`
      : metricsSentence(weather),
    second
      ? `Sementara itu, ${second[0]} diperkirakan terjadi di ${listNames(
          second[1].map((area) => area.area_name)
        )}.`
      : `Sebaran cuaca relatif sejalan di wilayah lain dalam area yang dipantau BMKG.`,
    `${bmkgAttribution(weather)} ${cautionSentence(weather)}`
  ].join("\n\n");
}

function templateTwelve(weather: NormalizedWeather) {
  const focusAreas = weather.area_breakdown.slice(0, 2);
  return [
    `${dateline(weather)} - Kondisi cuaca di wilayah ${weather.publication_location} pada ${longIndonesianDate(
      new Date(`${weather.date}T00:00:00`)
    )} umumnya akan ${weather.main_condition}.`,
    `Berdasarkan data Badan Meteorologi, Klimatologi, dan Geofisika (BMKG), suhu udara berkisar ${formatRange(
      weather.temperature_min,
      weather.temperature_max,
      "derajat Celsius"
    )}.`,
    focusAreas.length
      ? `Di wilayah ${listNames(focusAreas.map((area) => area.area_name))}, ${timeSummary(weather)}.`
      : `${timeSummary(weather)}.`,
    `${bmkgAttribution(weather)} ${cautionSentence(weather)}`
  ].join("\n\n");
}

function templateThirteen(weather: NormalizedWeather) {
  const first = weather.area_breakdown.slice(0, Math.ceil(weather.area_breakdown.length / 2));
  const second = weather.area_breakdown.slice(Math.ceil(weather.area_breakdown.length / 2));
  return [
    `${weather.publication_location.toUpperCase()} - Cuaca di wilayah ${weather.publication_location} pada ${longIndonesianDate(
      new Date(`${weather.date}T00:00:00`)
    )} diperkirakan didominasi ${weather.dominant_condition} yang relatif merata di sejumlah kecamatan.`,
    `Wilayah ${listNames(first.map((area) => area.area_name))} diprediksi mengalami ${weather.dominant_condition} dengan suhu berkisar ${formatRange(
      weather.temperature_min,
      weather.temperature_max,
      "derajat Celsius"
    )} serta tingkat kelembapan ${formatRange(weather.humidity_min, weather.humidity_max, "persen")}.`,
    second.length
      ? `Sementara itu, kawasan ${listNames(second.map((area) => area.area_name))} juga berpotensi mengalami kondisi serupa.`
      : `Wilayah yang dipantau BMKG menunjukkan pola cuaca yang relatif sama hingga malam hari.`,
    `${bmkgAttribution(weather)} ${cautionSentence(weather)}`
  ].join("\n\n");
}

const TEMPLATE_BUILDERS: Record<ConcreteTemplate, (weather: NormalizedWeather) => string> = {
  "Template 1": templateOne,
  "Template 2": templateTwo,
  "Template 3": templateThree,
  "Template 4": templateFour,
  "Template 5": templateFive,
  "Template 6": templateSix,
  "Template 7": templateSeven,
  "Template 8": templateEight,
  "Template 9": templateNine,
  "Template 10": templateTen,
  "Template 11": templateEleven,
  "Template 12": templateTwelve,
  "Template 13": templateThirteen
};

export function generateArticle(
  weather: NormalizedWeather,
  preference: TemplatePreference = "Auto"
): GeneratedArticle {
  const templateUsed = selectTemplate(weather, preference);
  const bodyText = TEMPLATE_BUILDERS[templateUsed](weather);

  return {
    templateUsed,
    title: titleForTemplate(weather, templateUsed),
    previewText: buildPreview(bodyText),
    bodyText
  };
}
