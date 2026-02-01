const LOCATION_PROFILES = [
  {
    key: "downtown_albany",
    label: "Downtown Albany",
    synonyms: ["downtown albany", "center square", "state capitol"],
    description: "State offices, hospitality, cultural venues, strong commuter inflow."
  },
  {
    key: "central_ave",
    label: "Central Avenue Corridor",
    synonyms: ["central ave", "midtown albany", "pine hills"],
    description: "Dense mixed-use corridor with transit access and student population."
  },
  {
    key: "arbor_hill",
    label: "Arbor Hill",
    synonyms: ["arbor hill", "north albany"],
    description: "Residential neighborhood near downtown with revitalization needs."
  },
  {
    key: "wolf_road",
    label: "Wolf Road / Colonie Center",
    synonyms: ["wolf road", "colonie center", "colonie"],
    description: "Retail and office hub with strong regional draw near the airport."
  }
];

function normalize(value = "") {
  return value.toLowerCase().trim();
}

function normalizeKey(value = "") {
  return normalize(value).replace(/\s+/g, "_");
}

export function resolveLocationKey(value) {
  if (!value) return null;
  const byKey = LOCATION_PROFILES.find((profile) => profile.key === normalizeKey(value));
  if (byKey) return byKey;

  const normalized = normalize(value);
  return LOCATION_PROFILES.find((profile) =>
    profile.synonyms.some((alias) => normalized.includes(alias)) || normalized.includes(profile.label.toLowerCase())
  ) || null;
}

export function getLocationLabel(key) {
  const profile = LOCATION_PROFILES.find((location) => location.key === key);
  return profile ? profile.label : key;
}

export function findLocationInText(text = "") {
  const normalized = normalize(text);
  if (!normalized) return null;
  return (
    LOCATION_PROFILES.find((profile) =>
      profile.synonyms.some((alias) => normalized.includes(alias)) || normalized.includes(profile.key)
    ) || null
  );
}

export { LOCATION_PROFILES };
