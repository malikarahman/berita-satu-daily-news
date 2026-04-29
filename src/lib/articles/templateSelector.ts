import type { ConcreteTemplate, NormalizedWeather, TemplatePreference } from "@/lib/articles/types";

function hasCondition(weather: NormalizedWeather, terms: string[]) {
  const haystack = [
    weather.main_condition,
    weather.dominant_condition,
    ...weather.area_breakdown.map((area) => area.condition),
    ...weather.risk_signals
  ]
    .join(" ")
    .toLowerCase();

  return terms.some((term) => haystack.includes(term));
}

function rainySegments(weather: NormalizedWeather) {
  return weather.time_segments.filter(
    (segment) =>
      segment.dominant_condition.includes("hujan") ||
      Boolean(segment.rain_intensity)
  );
}

export function selectTemplate(weather: NormalizedWeather, preference: TemplatePreference = "Auto"): ConcreteTemplate {
  if (preference !== "Auto") return preference;

  const uniqueAreaConditions = new Set(weather.area_breakdown.map((area) => area.condition));
  const uniqueRain = new Set(
    weather.area_breakdown
      .map((area) => area.rain_intensity)
      .filter((value): value is string => Boolean(value))
  );
  const hasRiskWarning =
    weather.risk_signals.length > 0 ||
    hasCondition(weather, ["petir", "guntur", "lebat", "angin kencang"]);
  const hasTimeStructure = weather.time_segments.length >= 3;
  const hasLaterDayShift =
    weather.time_segments.some(
      (segment) => segment.label === "pagi" && /cerah|berawan/.test(segment.dominant_condition)
    ) &&
    weather.time_segments.some(
      (segment) => (segment.label === "siang" || segment.label === "sore") && segment.dominant_condition.includes("hujan")
    );
  const isUniform = uniqueAreaConditions.size <= 1;
  const isMultiRegion = weather.area_breakdown.length >= 4;
  const isShortTimeShape = rainySegments(weather).length <= 2 && weather.time_segments.length >= 2;
  const isAllRegion = weather.coverage_type === "all_region";
  const isMultipleRegions = weather.coverage_type === "multiple_regions";
  const isSingleRegion = weather.coverage_type === "single_region";

  if (isAllRegion || isMultipleRegions) {
    if (hasRiskWarning && hasTimeStructure) return "Template 5";
    if (hasRiskWarning) return "Template 7";
    return "Template 4";
  }

  if (isSingleRegion && weather.area_breakdown.length >= 2) {
    if (hasRiskWarning) return "Template 5";
    if (uniqueRain.size > 1) return "Template 11";
    if (isUniform) return "Template 10";
  }

  if (hasRiskWarning && uniqueRain.size > 1) return "Template 1";
  if (hasRiskWarning && weather.risk_signals.length >= 1) return "Template 7";
  if (hasRiskWarning && hasTimeStructure) return "Template 5";
  if (uniqueRain.size > 1 && weather.area_breakdown.length >= 4) return "Template 11";
  if (hasTimeStructure && weather.temperature_min !== null && weather.humidity_min !== null) return "Template 6";
  if (hasLaterDayShift) return "Template 8";
  if (hasTimeStructure && weather.area_breakdown.length <= 3) return "Template 12";
  if (hasTimeStructure && uniqueAreaConditions.size > 1) return "Template 3";
  if (isMultiRegion && uniqueAreaConditions.size > 1) return "Template 4";
  if (isUniform && weather.area_breakdown.length >= 5) return "Template 13";
  if (isUniform) return "Template 10";
  if (isShortTimeShape) return "Template 9";
  return "Template 2";
}
