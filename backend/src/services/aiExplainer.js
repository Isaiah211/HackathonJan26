const currencyFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const numberFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const percentFmt = new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 0, maximumFractionDigits: 0 });

function safe(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function describeRelative(value, benchmark, higherIsBetter = true) {
  if (!benchmark || !Number.isFinite(value)) return "about average";
  const ratio = value / benchmark;
  if (ratio >= 1.25) return higherIsBetter ? "well above average" : "well above average (a challenge)";
  if (ratio >= 1.1) return higherIsBetter ? "above average" : "above average (a challenge)";
  if (ratio <= 0.8) return higherIsBetter ? "below average" : "below average (an advantage)";
  if (ratio <= 0.9) return higherIsBetter ? "slightly below average" : "slightly below average (an advantage)";
  return "about average";
}

function selectDrivers(features, benchmarks) {
  const drivers = [];
  if (!features || !benchmarks) return drivers;
  const rel = (key, higherIsBetter = true) => describeRelative(features[key], benchmarks[key], higherIsBetter);
  if (features.population_density) drivers.push({ label: "population density", text: rel("population_density", true) });
  if (features.transit_score) drivers.push({ label: "transit", text: rel("transit_score", true) });
  if (features.median_income) drivers.push({ label: "median income", text: rel("median_income", true) });
  if (features.unemployment_rate) drivers.push({ label: "unemployment", text: rel("unemployment_rate", false) });
  if (features.existing_business_count) drivers.push({ label: "competition", text: rel("existing_business_count", false) });
  return drivers;
}

export function generateAiExplanation({ prediction, input }) {
  const p = prediction || {};
  const f = p.feature_snapshot || {};
  const b = p.benchmarks || {};
  const jobCount = safe(p.jobs_created, 0);
  const wages = currencyFmt.format(safe(p.wages));
  const spending = currencyFmt.format(safe(p.local_spending));
  const salesTax = currencyFmt.format(safe(p.sales_tax));
  const foot = numberFmt.format(safe(p.foot_traffic));
  const confidence = Math.round(safe(p.confidence, 1) * 100);
  const locationLabel = input?.locationLabel || input?.locationKey || "the selected area";
  const businessLabel = input?.businessType || p.business_type || "business";
  const sizeLabel = input?.scale || p.scale || "medium";

  const popText = `${numberFmt.format(safe(f.population_density))} people/km² (${describeRelative(f.population_density, b.population_density, true)})`;
  const incomeText = `${currencyFmt.format(safe(f.median_income))} (${describeRelative(f.median_income, b.median_income, true)})`;
  const unemploymentText = `${percentFmt.format(safe(f.unemployment_rate, 0.05))} (${describeRelative(f.unemployment_rate, b.unemployment_rate, false)})`;
  const transitText = `${numberFmt.format(safe(f.transit_score))} (${describeRelative(f.transit_score, b.transit_score, true)})`;

  const drivers = selectDrivers(f, b)
    .map((d) => `${d.label}: ${d.text}`)
    .join("; ");

  const whyBetter = (() => {
    const positives = [];
    const negatives = [];
    if (f.population_density && f.population_density > safe(b.population_density, 1) * 1.05) positives.push("strong walk-in base");
    if (f.transit_score && f.transit_score > safe(b.transit_score, 1) * 1.05) positives.push("high transit connectivity");
    if (f.median_income && f.median_income > safe(b.median_income, 1) * 1.05) positives.push("above-median spending power");
    if (f.unemployment_rate && f.unemployment_rate > safe(b.unemployment_rate, 0.05) * 1.1) negatives.push("higher unemployment dampens spending");
    if (f.existing_business_count && f.existing_business_count > safe(b.existing_business_count, 1) * 1.1) negatives.push("heavier competition nearby");
    const better = positives.length ? `Strengths: ${positives.join(", ")}.` : "";
    const worse = negatives.length ? `Watchouts: ${negatives.join(", ")}.` : "";
    return `${better} ${worse}`.trim();
  })();

  return [
    `A new ${businessLabel} of size ${sizeLabel} is proposed in ${locationLabel}. Population density: ${popText}; median income: ${incomeText}; unemployment rate: ${unemploymentText}; transit score: ${transitText}.` ,
    `The predictive model estimates jobs created: ${numberFmt.format(jobCount)}, annual wages: ${wages}, foot traffic: ${foot} visits/month, local spending: ${spending}/month, sales tax: ${salesTax}/month (confidence ~${confidence}%).`,
    `Compared with regional averages, drivers are ${drivers || "mixed"}. ${whyBetter}`,
    `Planner takeaway: Align storefront and access with transit and pedestrian flows; monitor competition and income fit; consider local hiring to address unemployment; use the spending and tax forecasts to support permitting and incentive decisions.`
  ].join(" ");
}
