export function runSimulation({ city, intervention, scale }) {
  let trafficChange = 0;
  let emissionsChange = 0;

  switch (intervention) {
    case "bike_lane":
      trafficChange = -5 * scale;
      emissionsChange = -3 * scale;
      break;
    case "park":
      trafficChange = -2 * scale;
      emissionsChange = -1 * scale;
      break;
    case "bus_route":
      trafficChange = -7 * scale;
      emissionsChange = -4 * scale;
      break;
  }

  return {
    city,
    intervention,
    traffic_change: `${trafficChange}%`,
    emissions_change: `${emissionsChange}%`,
    confidence: "Prototype estimate based on planning heuristics",
    summary: `Adding a ${intervention.replace("_", " ")} in ${city} is expected to reduce traffic and emissions.`
  };
}
