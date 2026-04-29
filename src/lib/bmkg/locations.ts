import {
  findLocationGroup,
  listActiveLocationGroups,
  listLocationGroups,
  listLocationOptions,
  searchLocationOptions,
  type LocationGroupConfig
} from "@/data/locationGroups";

export function getLocationGroup(location: string): LocationGroupConfig | undefined {
  return findLocationGroup(location);
}

export function configuredLocations() {
  return listLocationOptions();
}

export function configuredLocationGroups() {
  return listLocationGroups();
}

export function searchConfiguredLocations(query: string) {
  return searchLocationOptions(query);
}

export function scheduledLocationsFromEnv() {
  const raw = process.env.DEFAULT_SCHEDULED_LOCATIONS;
  if (!raw) {
    return listActiveLocationGroups().map((group) => group.publishLocationName);
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
