export const TEMPLATE_OPTIONS = [
  "Auto",
  "Template 1",
  "Template 2",
  "Template 3",
  "Template 4",
  "Template 5",
  "Template 6",
  "Template 7",
  "Template 8",
  "Template 9",
  "Template 10",
  "Template 11",
  "Template 12",
  "Template 13"
] as const;

export const TEMPLATE_DESCRIPTIONS: Record<(typeof TEMPLATE_OPTIONS)[number], string> = {
  Auto: "Pilih template otomatis berdasarkan bentuk data cuaca yang tersedia.",
  "Template 1": "Weather Warning / Extreme Weather Risk Pattern",
  "Template 2": "Area-Based Daily Forecast Pattern",
  "Template 3": "Specific Hour Forecast Pattern",
  "Template 4": "Multi-Region / Multi-City Forecast Pattern",
  "Template 5": "Area Forecast with Risk Warning Pattern",
  "Template 6": "Time-of-Day Forecast with Weather Metrics Pattern",
  "Template 7": "Forecast with Official Statement / Warning Emphasis Pattern",
  "Template 8": "Daily Forecast with Weather Change Later in the Day Pattern",
  "Template 9": "Short Time-Based Forecast Pattern",
  "Template 10": "Uniform Weather Condition Pattern",
  "Template 11": "Area-Based Rain Intensity Split Pattern",
  "Template 12": "Short Jakarta-Style Daily Forecast Pattern",
  "Template 13": "Uniform Area Forecast with Local Dateline Pattern"
};
