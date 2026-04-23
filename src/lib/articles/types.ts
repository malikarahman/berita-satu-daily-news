export const ARTICLE_STATUSES = [
  "Generated",
  "Pending Review",
  "Approved",
  "Revision Needed",
  "Rejected"
] as const;

export const RUN_TYPES = ["Scheduled", "Manual"] as const;
export const TEMPLATE_PREFERENCES = ["Auto", "Template 1", "Template 2", "Template 3"] as const;

export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];
export type RunType = (typeof RUN_TYPES)[number];
export type TemplatePreference = (typeof TEMPLATE_PREFERENCES)[number];

export type WeatherArea = {
  name: string;
  condition: string;
  temperature_min: number | null;
  temperature_max: number | null;
  humidity_min: number | null;
  humidity_max: number | null;
};

export type WeatherTimeSegment = {
  label: "pagi" | "siang" | "sore" | "malam";
  condition: string;
  temperature: number | null;
  humidity: number | null;
};

export type NormalizedWeather = {
  source: "BMKG";
  source_url: string;
  location: string;
  date: string;
  day_name: string;
  main_condition: string;
  temperature_min: number | null;
  temperature_max: number | null;
  humidity_min: number | null;
  humidity_max: number | null;
  areas: WeatherArea[];
  time_segments: WeatherTimeSegment[];
  fetched_at: string;
  source_mode: "live" | "fallback";
  warnings?: string[];
};

export type GeneratedArticle = {
  templateUsed: "Template 1" | "Template 2" | "Template 3";
  title: string;
  previewText: string;
  bodyText: string;
};

export type RunArticleInput = {
  category: string;
  location: string;
  dataSource: string;
  intendedPublishDate: string;
  intendedPublishTime: string;
  templatePreference?: TemplatePreference;
  assignedEditor?: string | null;
  notes?: string | null;
  triggeredBy?: string;
};
