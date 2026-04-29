import type { CoverageType } from "@/lib/articles/types";

export type PublicationAreaOption = {
  label: string;
  sourceKey: string;
};

export type RegionGroup = {
  label: string;
  value: string;
  publicationAreas: PublicationAreaOption[];
};

export const REGION_GROUPS: RegionGroup[] = [
  {
    label: "Jakarta",
    value: "jakarta",
    publicationAreas: [
      { label: "Jakarta Selatan", sourceKey: "Jakarta Selatan" },
      { label: "Jakarta Utara", sourceKey: "Jakarta Utara" },
      { label: "Jakarta Timur", sourceKey: "Jakarta Timur" },
      { label: "Jakarta Pusat", sourceKey: "Jakarta Pusat" },
      { label: "Jakarta Barat", sourceKey: "Jakarta Barat" },
      { label: "Kepulauan Seribu", sourceKey: "Kepulauan Seribu" }
    ]
  },
  {
    label: "Tangerang",
    value: "tangerang",
    publicationAreas: [
      { label: "Kota Tangerang", sourceKey: "Kota Tangerang" },
      { label: "Kota Tangerang Selatan", sourceKey: "Tangerang Selatan" },
      { label: "Kabupaten Tangerang", sourceKey: "Kabupaten Tangerang" }
    ]
  },
  {
    label: "Bogor",
    value: "bogor",
    publicationAreas: [
      { label: "Kota Bogor", sourceKey: "Bogor" },
      { label: "Kabupaten Bogor", sourceKey: "Kabupaten Bogor" }
    ]
  },
  {
    label: "Depok",
    value: "depok",
    publicationAreas: [{ label: "Kota Depok", sourceKey: "Depok" }]
  },
  {
    label: "Bekasi",
    value: "bekasi",
    publicationAreas: [
      { label: "Kota Bekasi", sourceKey: "Bekasi" },
      { label: "Kabupaten Bekasi", sourceKey: "Kabupaten Bekasi" }
    ]
  }
];

export const ALL_REGION_OPTION = {
  label: "Jabodetabek",
  value: "jabodetabek",
  includedRegions: ["jakarta", "bogor", "depok", "tangerang", "bekasi"]
} as const;

function uniqueByLabel(items: PublicationAreaOption[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.label)) return false;
    seen.add(item.label);
    return true;
  });
}

export function listRegionOptions() {
  return REGION_GROUPS.map((group) => ({ label: group.label, value: group.value }));
}

export function findRegionGroup(value: string) {
  const normalized = value.trim().toLowerCase();
  return REGION_GROUPS.find((group) => group.value === normalized || group.label.toLowerCase() === normalized) ?? null;
}

export function listPublicationAreaOptions(regionValues?: string[]) {
  if (!regionValues?.length) {
    return uniqueByLabel(REGION_GROUPS.flatMap((group) => group.publicationAreas));
  }
  return uniqueByLabel(
    regionValues.flatMap((value) => findRegionGroup(value)?.publicationAreas ?? [])
  );
}

export function publicationAreaLabelToSourceKey(label: string) {
  const normalized = label.trim().toLowerCase();
  return (
    listPublicationAreaOptions().find((area) => area.label.toLowerCase() === normalized)?.sourceKey ??
    label
  );
}

export function findRegionByPublicationArea(label: string) {
  const normalized = label.trim().toLowerCase();
  return (
    REGION_GROUPS.find((group) =>
      group.publicationAreas.some((area) => area.label.toLowerCase() === normalized)
    ) ?? null
  );
}

export function regionLabelsFromValues(values: string[]) {
  return values
    .map((value) => findRegionGroup(value)?.label)
    .filter((value): value is string => Boolean(value));
}

export function coverageLabelFromSelection(input: {
  coverageType: CoverageType;
  regionValues?: string[];
  publicationAreas?: string[];
}) {
  if (input.coverageType === "all_region") return ALL_REGION_OPTION.label;
  if (input.coverageType === "single_region") {
    return regionLabelsFromValues(input.regionValues ?? [])[0] ?? "Wilayah pilihan";
  }
  if (input.coverageType === "multiple_regions") {
    const labels = regionLabelsFromValues(input.regionValues ?? []);
    if (labels.length <= 1) return labels[0] ?? "Wilayah pilihan";
    if (labels.length === 2) return `${labels[0]} dan ${labels[1]}`;
    return `${labels.slice(0, -1).join(", ")}, dan ${labels[labels.length - 1]}`;
  }
  const labels = input.publicationAreas ?? [];
  if (labels.length <= 1) return labels[0] ?? "Wilayah pilihan";
  if (labels.length === 2) return `${labels[0]} dan ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, dan ${labels[labels.length - 1]}`;
}

export function resolvePublicationAreas(input: {
  coverageType: CoverageType;
  regionValues?: string[];
  publicationAreas?: string[];
}) {
  if (input.coverageType === "all_region") {
    return ALL_REGION_OPTION.includedRegions.flatMap((value) => findRegionGroup(value)?.publicationAreas ?? []);
  }
  if (input.coverageType === "single_region") {
    const region = findRegionGroup(input.regionValues?.[0] ?? "");
    return region?.publicationAreas ?? [];
  }
  if (input.coverageType === "multiple_regions") {
    return uniqueByLabel(
      (input.regionValues ?? []).flatMap((value) => findRegionGroup(value)?.publicationAreas ?? [])
    );
  }
  return uniqueByLabel(
    (input.publicationAreas ?? []).map((label) => ({
      label,
      sourceKey: publicationAreaLabelToSourceKey(label)
    }))
  );
}
