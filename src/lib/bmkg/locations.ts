export type BmkgAreaSource = {
  areaName: string;
  adm4: string;
};

export type BmkgLocationConfig = {
  name: string;
  aliases: string[];
  defaultTemplateBias?: "Template 1" | "Template 2" | "Template 3";
  areas: BmkgAreaSource[];
};

export const BMKG_LOCATION_CONFIGS: BmkgLocationConfig[] = [
  {
    name: "Jakarta",
    aliases: ["DKI Jakarta"],
    defaultTemplateBias: "Template 2",
    areas: [
      { areaName: "Jakarta Pusat", adm4: "31.71.03.1001" },
      { areaName: "Jakarta Timur", adm4: "31.75.01.1001" },
      { areaName: "Jakarta Selatan", adm4: "31.74.01.1001" },
      { areaName: "Jakarta Barat", adm4: "31.73.01.1001" },
      { areaName: "Jakarta Utara", adm4: "31.72.01.1001" }
    ]
  },
  {
    name: "Tangerang Selatan",
    aliases: ["Tangsel"],
    areas: [
      { areaName: "Serpong", adm4: "36.74.04.1001" },
      { areaName: "Serpong Utara", adm4: "36.74.05.1001" },
      { areaName: "Pondok Aren", adm4: "36.74.03.1001" },
      { areaName: "Pamulang", adm4: "36.74.02.1001" },
      { areaName: "Setu", adm4: "36.74.07.1001" },
      { areaName: "Ciputat", adm4: "36.74.01.1001" },
      { areaName: "Ciputat Timur", adm4: "36.74.06.1001" }
    ]
  },
  {
    name: "Depok",
    aliases: [],
    areas: [
      { areaName: "Beji", adm4: "32.76.05.1001" },
      { areaName: "Cimanggis", adm4: "32.76.01.1001" },
      { areaName: "Pancoran Mas", adm4: "32.76.03.1001" },
      { areaName: "Sukmajaya", adm4: "32.76.02.1001" }
    ]
  },
  {
    name: "Bekasi",
    aliases: ["Kota Bekasi"],
    areas: [
      { areaName: "Bekasi Timur", adm4: "32.75.01.1001" },
      { areaName: "Bekasi Barat", adm4: "32.75.02.1001" },
      { areaName: "Bekasi Selatan", adm4: "32.75.03.1001" },
      { areaName: "Bekasi Utara", adm4: "32.75.04.1001" }
    ]
  },
  {
    name: "Bogor",
    aliases: ["Kota Bogor"],
    areas: [
      { areaName: "Bogor Tengah", adm4: "32.71.01.1001" },
      { areaName: "Bogor Barat", adm4: "32.71.02.1001" },
      { areaName: "Bogor Selatan", adm4: "32.71.03.1001" },
      { areaName: "Bogor Timur", adm4: "32.71.04.1001" }
    ]
  }
];

export function getLocationConfig(location: string) {
  const normalized = location.trim().toLowerCase();
  return BMKG_LOCATION_CONFIGS.find(
    (item) =>
      item.name.toLowerCase() === normalized ||
      item.aliases.some((alias) => alias.toLowerCase() === normalized)
  );
}

export function configuredLocations() {
  return BMKG_LOCATION_CONFIGS.map((item) => item.name);
}

export function scheduledLocationsFromEnv() {
  const raw = process.env.DEFAULT_SCHEDULED_LOCATIONS;
  if (!raw) return configuredLocations();
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
