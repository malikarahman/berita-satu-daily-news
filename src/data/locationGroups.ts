export type RepresentativeLocationConfig = {
  name: string;
  adm4Code: string;
  aliases?: string[];
  priority?: number;
};

export type LocationGroupConfig = {
  groupName: string;
  publishLocationName: string;
  aliases: string[];
  active: boolean;
  representativeLocations: RepresentativeLocationConfig[];
};

export const LOCATION_GROUPS: LocationGroupConfig[] = [
  {
    groupName: "Jakarta",
    publishLocationName: "Jakarta",
    aliases: ["DKI Jakarta", "DKI"],
    active: true,
    representativeLocations: [
      { name: "Jakarta Pusat", adm4Code: "31.71.03.1001" },
      { name: "Jakarta Timur", adm4Code: "31.75.01.1001" },
      { name: "Jakarta Selatan", adm4Code: "31.74.01.1001" },
      { name: "Jakarta Barat", adm4Code: "31.73.01.1001" },
      { name: "Jakarta Utara", adm4Code: "31.72.01.1001" }
    ]
  },
  {
    groupName: "Jakarta Selatan",
    publishLocationName: "Jakarta Selatan",
    aliases: ["Jaksel"],
    active: true,
    representativeLocations: [
      { name: "Kebayoran Baru", adm4Code: "31.74.01.1001" },
      { name: "Tebet", adm4Code: "31.74.02.1001" },
      { name: "Pasar Minggu", adm4Code: "31.74.03.1001" },
      { name: "Cilandak", adm4Code: "31.74.04.1001" },
      { name: "Jagakarsa", adm4Code: "31.74.05.1001" }
    ]
  },
  {
    groupName: "Jakarta Utara",
    publishLocationName: "Jakarta Utara",
    aliases: ["Jakut"],
    active: true,
    representativeLocations: [
      { name: "Koja", adm4Code: "31.72.01.1001" },
      { name: "Tanjung Priok", adm4Code: "31.72.02.1001" },
      { name: "Kelapa Gading", adm4Code: "31.72.03.1001" },
      { name: "Penjaringan", adm4Code: "31.72.04.1001" }
    ]
  },
  {
    groupName: "Jakarta Timur",
    publishLocationName: "Jakarta Timur",
    aliases: ["Jaktim"],
    active: true,
    representativeLocations: [
      { name: "Matraman", adm4Code: "31.75.01.1001" },
      { name: "Jatinegara", adm4Code: "31.75.02.1001" },
      { name: "Cakung", adm4Code: "31.75.03.1001" },
      { name: "Duren Sawit", adm4Code: "31.75.04.1001" }
    ]
  },
  {
    groupName: "Jakarta Pusat",
    publishLocationName: "Jakarta Pusat",
    aliases: ["Jakpus"],
    active: true,
    representativeLocations: [
      { name: "Gambir", adm4Code: "31.71.03.1001" },
      { name: "Menteng", adm4Code: "31.71.01.1001" },
      { name: "Tanah Abang", adm4Code: "31.71.02.1001" }
    ]
  },
  {
    groupName: "Jakarta Barat",
    publishLocationName: "Jakarta Barat",
    aliases: ["Jakbar"],
    active: true,
    representativeLocations: [
      { name: "Grogol Petamburan", adm4Code: "31.73.01.1001" },
      { name: "Kebon Jeruk", adm4Code: "31.73.02.1001" },
      { name: "Kembangan", adm4Code: "31.73.03.1001" },
      { name: "Palmerah", adm4Code: "31.73.04.1001" }
    ]
  },
  {
    groupName: "Kepulauan Seribu",
    publishLocationName: "Kepulauan Seribu",
    aliases: ["Seribu"],
    active: true,
    representativeLocations: [
      { name: "Pulau Untung Jawa", adm4Code: "31.01.01.1001" },
      { name: "Pulau Lancang", adm4Code: "31.01.02.1001" },
      { name: "Pulau Tidung", adm4Code: "31.01.03.1001" }
    ]
  },
  {
    groupName: "Tangerang",
    publishLocationName: "Tangerang",
    aliases: ["Kota Tangerang", "Wilayah Tangerang"],
    active: true,
    representativeLocations: [
      { name: "Ciledug", adm4Code: "36.71.01.1001" },
      { name: "Karawaci", adm4Code: "36.71.05.1001" },
      { name: "Pinang", adm4Code: "36.71.09.1001" },
      { name: "Cipondoh", adm4Code: "36.71.03.1001" }
    ]
  },
  {
    groupName: "Kota Tangerang",
    publishLocationName: "Kota Tangerang",
    aliases: ["Tangerang"],
    active: true,
    representativeLocations: [
      { name: "Ciledug", adm4Code: "36.71.01.1001" },
      { name: "Karawaci", adm4Code: "36.71.05.1001" },
      { name: "Pinang", adm4Code: "36.71.09.1001" },
      { name: "Cipondoh", adm4Code: "36.71.03.1001" }
    ]
  },
  {
    groupName: "Tangerang Selatan",
    publishLocationName: "Tangerang Selatan",
    aliases: ["Tangsel", "Kota Tangerang Selatan"],
    active: true,
    representativeLocations: [
      { name: "Serpong", adm4Code: "36.74.04.1001" },
      { name: "Pamulang", adm4Code: "36.74.02.1001" },
      { name: "Ciputat", adm4Code: "36.74.01.1001" },
      { name: "Pondok Aren", adm4Code: "36.74.03.1001" },
      { name: "Setu", adm4Code: "36.74.07.1001" }
    ]
  },
  {
    groupName: "Kabupaten Tangerang",
    publishLocationName: "Kabupaten Tangerang",
    aliases: ["Kab Tangerang"],
    active: true,
    representativeLocations: [
      { name: "Tigaraksa", adm4Code: "36.03.01.1001" },
      { name: "Balaraja", adm4Code: "36.03.02.1001" },
      { name: "Cikupa", adm4Code: "36.03.03.1001" },
      { name: "Pasar Kemis", adm4Code: "36.03.04.1001" }
    ]
  },
  {
    groupName: "Depok",
    publishLocationName: "Depok",
    aliases: ["Kota Depok"],
    active: true,
    representativeLocations: [
      { name: "Beji", adm4Code: "32.76.05.1001" },
      { name: "Cimanggis", adm4Code: "32.76.01.1001" },
      { name: "Pancoran Mas", adm4Code: "32.76.03.1001" },
      { name: "Sukmajaya", adm4Code: "32.76.02.1001" }
    ]
  },
  {
    groupName: "Bekasi",
    publishLocationName: "Bekasi",
    aliases: ["Kota Bekasi", "Wilayah Bekasi"],
    active: true,
    representativeLocations: [
      { name: "Bekasi Timur", adm4Code: "32.75.01.1001" },
      { name: "Bekasi Barat", adm4Code: "32.75.02.1001" },
      { name: "Bekasi Selatan", adm4Code: "32.75.03.1001" },
      { name: "Bekasi Utara", adm4Code: "32.75.04.1001" }
    ]
  },
  {
    groupName: "Kabupaten Bekasi",
    publishLocationName: "Kabupaten Bekasi",
    aliases: ["Kab Bekasi"],
    active: true,
    representativeLocations: [
      { name: "Cikarang Barat", adm4Code: "32.16.01.1001" },
      { name: "Cikarang Utara", adm4Code: "32.16.02.1001" },
      { name: "Tambun Selatan", adm4Code: "32.16.03.1001" },
      { name: "Setu Bekasi", adm4Code: "32.16.04.1001" }
    ]
  },
  {
    groupName: "Bogor",
    publishLocationName: "Bogor",
    aliases: ["Kota Bogor", "Wilayah Bogor"],
    active: true,
    representativeLocations: [
      { name: "Bogor Tengah", adm4Code: "32.71.01.1001" },
      { name: "Bogor Barat", adm4Code: "32.71.02.1001" },
      { name: "Bogor Selatan", adm4Code: "32.71.03.1001" },
      { name: "Bogor Timur", adm4Code: "32.71.04.1001" }
    ]
  },
  {
    groupName: "Kabupaten Bogor",
    publishLocationName: "Kabupaten Bogor",
    aliases: ["Kab Bogor"],
    active: true,
    representativeLocations: [
      { name: "Cibinong", adm4Code: "32.01.01.1001" },
      { name: "Citeureup", adm4Code: "32.01.02.1001" },
      { name: "Gunung Putri", adm4Code: "32.01.03.1001" },
      { name: "Parung", adm4Code: "32.01.04.1001" }
    ]
  }
];

export function listLocationGroups() {
  return LOCATION_GROUPS;
}

export function listActiveLocationGroups() {
  return LOCATION_GROUPS.filter((group) => group.active);
}

export function listLocationOptions() {
  return LOCATION_GROUPS.map((group) => group.publishLocationName);
}

export function findLocationGroup(query: string) {
  const normalized = query.trim().toLowerCase();
  return LOCATION_GROUPS.find(
    (group) =>
      group.publishLocationName.toLowerCase() === normalized ||
      group.groupName.toLowerCase() === normalized ||
      group.aliases.some((alias) => alias.toLowerCase() === normalized) ||
      group.representativeLocations.some(
        (location) =>
          location.name.toLowerCase() === normalized ||
          location.aliases?.some((alias) => alias.toLowerCase() === normalized)
      )
  );
}

export function searchLocationOptions(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return listLocationOptions();

  const matches = new Set<string>();
  LOCATION_GROUPS.forEach((group) => {
    const haystack = [
      group.publishLocationName,
      group.groupName,
      ...group.aliases,
      ...group.representativeLocations.flatMap((location) => [location.name, ...(location.aliases ?? [])])
    ];
    if (haystack.some((value) => value.toLowerCase().includes(normalized))) {
      matches.add(group.publishLocationName);
    }
  });
  return [...matches];
}
