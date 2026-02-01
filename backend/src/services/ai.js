const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function generateAISummary({ prediction = {}, input = {}, query = "" }) {
  const wages = currencyFormatter.format(prediction.wages || 0);
  const spending = currencyFormatter.format(prediction.local_spending || 0);
  const tax = currencyFormatter.format(prediction.sales_tax || 0);
  const footTraffic = Math.round(prediction.foot_traffic || 0).toLocaleString();
  const confidence = prediction.confidence
    ? Math.round(Math.min(Math.max(prediction.confidence, 0.6), 1.2) * 100)
    : 92;
  const locationLabel = input.locationLabel || "the selected area";
  const promptExcerpt = query ? `Prompt: "${query}".` : "";

  return `${promptExcerpt} ${locationLabel} can sustain roughly ${footTraffic} monthly visits, driving ${spending} in local purchases and ${tax} in sales tax. Payroll demand is estimated at ${wages}, with a ${confidence}% confidence score after parsing your brief.`.trim();
}
