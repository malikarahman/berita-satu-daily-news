import { TEMPLATE_OPTIONS } from "@/data/articleTemplates";

export const ARTICLE_STATUSES = [
  "Generated",
  "Pending Review",
  "Approved",
  "Revision Needed",
  "Rejected"
] as const;

export const RUN_TYPES = ["Scheduled", "Manual", "Automated Manual"] as const;
export const TEMPLATE_PREFERENCES = TEMPLATE_OPTIONS;
export const COVERAGE_TYPES = [
  "single_region",
  "multiple_publication_areas",
  "multiple_regions",
  "all_region"
] as const;

export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];
export type RunType = (typeof RUN_TYPES)[number];
export type TemplatePreference = (typeof TEMPLATE_PREFERENCES)[number];
export type ConcreteTemplate = Exclude<TemplatePreference, "Auto">;
export type CoverageType = (typeof COVERAGE_TYPES)[number];

export type WeatherArea = {
  area_name: string;
  condition: string;
  rain_intensity: string | null;
  temperature_min: number | null;
  temperature_max: number | null;
  humidity_min: number | null;
  humidity_max: number | null;
  wind_speed_min: number | null;
  wind_speed_max: number | null;
};

export type RepresentativeLocationWeather = {
  name: string;
  adm4_code: string;
  source_url: string;
  condition: string;
  rain_intensity: string | null;
  temperature_min: number | null;
  temperature_max: number | null;
  humidity_min: number | null;
  humidity_max: number | null;
  wind_speed_min: number | null;
  wind_speed_max: number | null;
};

export type WeatherTimeSegment = {
  label: "pagi" | "siang" | "sore" | "malam";
  start_time: string;
  end_time: string;
  dominant_condition: string;
  rain_intensity: string | null;
  affected_areas: string[];
  temperature_min: number | null;
  temperature_max: number | null;
  humidity_min: number | null;
  humidity_max: number | null;
  wind_speed_min: number | null;
  wind_speed_max: number | null;
};

export type WeatherDataCompleteness = {
  representative_location_count: number;
  minimum_required_location_count: number;
  is_complete: boolean;
  missing_fields: string[];
  notes: string | null;
};

export type NormalizedWeather = {
  source: "BMKG";
  source_url: string;
  fetched_at: string;
  publication_location: string;
  location_type: "single_location" | "location_group" | "coverage_group";
  date: string;
  day_name: string;
  main_condition: string;
  dominant_condition: string;
  rain_intensity_summary: string | null;
  risk_signals: string[];
  temperature_min: number | null;
  temperature_max: number | null;
  humidity_min: number | null;
  humidity_max: number | null;
  wind_speed_min: number | null;
  wind_speed_max: number | null;
  representative_locations: RepresentativeLocationWeather[];
  area_breakdown: WeatherArea[];
  time_segments: WeatherTimeSegment[];
  data_completeness: WeatherDataCompleteness;
  source_mode: "live" | "fallback_sample";
  coverage_type?: CoverageType;
  selected_region_groups?: string[];
  selected_publication_areas?: string[];
  publication_area_count?: number;
  aggregation_notes?: string[];
};

export type GeneratedArticle = {
  templateUsed: ConcreteTemplate;
  title: string;
  previewText: string;
  bodyText: string;
};

export type RunArticleInput = {
  category?: string;
  location?: string;
  dataSource?: string;
  intendedPublishDate?: string;
  templatePreference?: TemplatePreference;
  assignedEditor?: string | null;
  notes?: string | null;
  triggeredBy?: string;
  editorInstruction?: string | null;
  coverageType?: CoverageType;
  selectedRegionGroups?: string[];
  selectedPublicationAreas?: string[];
  useAllRegion?: boolean;
};
