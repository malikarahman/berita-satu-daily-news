import type { NormalizedWeather, TemplatePreference } from "@/lib/articles/types";

type ConcreteTemplate = "Template 1" | "Template 2" | "Template 3";
type RainIntensity = "hujan lebat" | "hujan sedang" | "hujan ringan" | "hujan";

function rainIntensity(condition: string): RainIntensity | null {
  const lower = condition.toLowerCase();
  if (!lower.includes("hujan")) return null;
  if (lower.includes("lebat")) return "hujan lebat";
  if (lower.includes("sedang")) return "hujan sedang";
  if (lower.includes("ringan")) return "hujan ringan";
  return "hujan";
}

export function selectTemplate(weather: NormalizedWeather, preference: TemplatePreference = "Auto"): ConcreteTemplate {
  if (preference !== "Auto") return preference;

  const rainGroups = new Set(
    weather.areas
      .map((area) => rainIntensity(area.condition))
      .filter((item): item is RainIntensity => Boolean(item))
  );
  const areaConditions = new Set(weather.areas.map((area) => area.condition));
  const hasTimeOfDayShape = weather.time_segments.length >= 3;
  const isJakartaStyle = weather.location.toLowerCase().includes("jakarta");

  if (rainGroups.size > 1) return "Template 1";
  if (isJakartaStyle || (hasTimeOfDayShape && weather.areas.length <= 2)) return "Template 2";
  if (areaConditions.size <= 2) return "Template 3";

  return hasTimeOfDayShape ? "Template 2" : "Template 1";
}
