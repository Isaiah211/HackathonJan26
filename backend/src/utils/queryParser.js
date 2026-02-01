import { findLocationInText, getLocationLabel, resolveLocationKey } from "./locationProfiles.js";

const SCALE_KEYWORDS = {
  small: ["small", "tiny", "boutique", "pilot", "pop-up", "micro"],
  medium: ["medium", "mid", "moderate"],
  large: ["large", "big", "major", "flagship", "regional", "anchor"],
};

const SCALE_HINTS = {
  large: ["flagship", "anchor", "regional", "campus", "distribution", "multi-story", "multi level", "warehouse", "logistics", "big-box", "two-story"],
  small: ["pilot", "pop-up", "boutique", "test", "micro", "starter", "kiosk", "counter-service", "stall"],
};

const BUSINESS_KEYWORDS = {
  grocery: ["grocery", "supermarket", "market", "food store", "co-op", "bodega"],
  restaurant: ["restaurant", "cafe", "eatery", "diner", "brewpub", "bistro"],
  retail: ["retail", "boutique", "store", "shop", "showroom"],
  service: ["service", "salon", "laundry", "repair", "studio", "workshop"],
  healthcare: ["clinic", "medical", "pharmacy", "hospital", "urgent care", "wellness"],
  entertainment: ["entertainment", "theater", "cinema", "venue", "nightlife", "arcade"],
};

const CONTEXT_RULES = [
  {
    keywords: ["high-end", "luxury", "premium", "gourmet", "upscale", "artisan", "organic", "chef-driven"],
    adjustments: { demandBoost: 1.18, spendPremium: 1.28, wagePremium: 1.08, confidence: 1.05 },
  },
  {
    keywords: ["budget", "discount", "value", "affordable", "dollar"],
    adjustments: { demandBoost: 1.02, spendPremium: 0.85, wagePremium: 0.9 },
  },
  {
    keywords: ["student", "campus", "college", "university", "dorm"],
    adjustments: { demandBoost: 1.14, spendPremium: 0.9, wagePremium: 0.9 },
  },
  {
    keywords: ["tourist", "visitor", "hotel", "convention", "riverfront", "cruise", "festival"],
    adjustments: { demandBoost: 1.15, spendPremium: 1.12 },
  },
  {
    keywords: ["nightlife", "late-night", "brewpub", "bar", "club", "speakeasy"],
    adjustments: { demandBoost: 1.18, spendPremium: 1.08, wagePremium: 1.08 },
  },
  {
    keywords: ["community", "nonprofit", "co-op", "mutual aid", "food pantry"],
    adjustments: { demandBoost: 0.92, spendPremium: 0.88, wagePremium: 0.88 },
  },
  {
    keywords: ["flagship", "regional", "destination", "anchor", "hub", "campus"],
    adjustments: { demandBoost: 1.25, spendPremium: 1.2, wagePremium: 1.12, confidence: 1.06 },
  },
  {
    keywords: ["family", "children", "kid-friendly", "after-school"],
    adjustments: { demandBoost: 1.06, spendPremium: 0.96 },
  },
  {
    keywords: ["wellness", "medical", "therapy", "clinic", "urgent care"],
    adjustments: { demandBoost: 1.05, spendPremium: 1.08, wagePremium: 1.12 },
  },
];

function applyAdjustments(target, adjustments) {
  Object.entries(adjustments).forEach(([key, factor]) => {
    if (factor === undefined || factor === null) return;
    target[key] *= factor;
  });
}

function clamp(value, min = 0.75, max = 1.4) {
  return Math.min(max, Math.max(min, value));
}

function detectScaleFromNumbers(text) {
  const sqftMatch = text.match(/(\d+(?:[.,]\d+)?)(?:\s|-)?(k|m|million|thousand)?\s*(?:sq\s?ft|square feet|sf|ksf|square-foot)/);
  const sqft = sqftMatch ? parseMagnitude(sqftMatch[1], sqftMatch[2]) : null;
  if (sqft) {
    if (sqft >= 20000) return "large";
    if (sqft <= 4000) return "small";
  }

  const seatingMatch = text.match(/(\d+(?:[.,]\d+)?)(?:\s|-)?(k|thousand)?\s*(?:seat|seating|chairs|tables)/);
  const seats = seatingMatch ? parseMagnitude(seatingMatch[1], seatingMatch[2]) : null;
  if (seats) {
    if (seats >= 120) return "large";
    if (seats <= 25) return "small";
  }

  const staffMatch = text.match(/(\d+(?:[.,]\d+)?)(?:\s|-)?(k|thousand)?\s*(?:employee|job|worker|staff)/);
  const staff = staffMatch ? parseMagnitude(staffMatch[1], staffMatch[2]) : null;
  if (staff) {
    if (staff >= 70) return "large";
    if (staff <= 12) return "small";
  }

  return null;
}

function applyQuantitativeSignals(text, signals) {
  const seatingMatch = text.match(/(\d+(?:[.,]\d+)?)(?:\s|-)?(k|thousand)?\s*(?:seat|seating|chairs|tables)/);
  const seats = seatingMatch ? parseMagnitude(seatingMatch[1], seatingMatch[2]) : null;
  if (seats) {
    if (seats >= 180) {
      applyAdjustments(signals, { demandBoost: 1.22, spendPremium: 1.05, confidence: 1.03 });
    } else if (seats >= 70) {
      applyAdjustments(signals, { demandBoost: 1.12, spendPremium: 1.02 });
    }
  }

  const staffMatch = text.match(/(\d+(?:[.,]\d+)?)(?:\s|-)?(k|thousand)?\s*(?:employee|job|worker|staff)/);
  const staff = staffMatch ? parseMagnitude(staffMatch[1], staffMatch[2]) : null;
  if (staff) {
    if (staff >= 80) {
      applyAdjustments(signals, { wagePremium: 1.22, demandBoost: 1.1, confidence: 1.04 });
    } else if (staff >= 30) {
      applyAdjustments(signals, { wagePremium: 1.1, demandBoost: 1.05 });
    }
  }

  const sqftMatch = text.match(/(\d+(?:[.,]\d+)?)(?:\s|-)?(k|m|million|thousand)?\s*(?:sq\s?ft|square feet|sf|ksf|square-foot)/);
  const sqft = sqftMatch ? parseMagnitude(sqftMatch[1], sqftMatch[2]) : null;
  if (sqft) {
    if (sqft >= 40000) {
      applyAdjustments(signals, { demandBoost: 1.28, spendPremium: 1.15, confidence: 1.04 });
    } else if (sqft >= 12000) {
      applyAdjustments(signals, { demandBoost: 1.14, spendPremium: 1.08 });
    }
  }

  const budgetMatch = text.match(/(\d+(?:[.,]\d+)?)(?:\s|-)?(m|million|k|thousand)?\s*(?:budget|investment|build\s?out|capex|renovation)/);
  const budget = budgetMatch ? parseMagnitude(budgetMatch[1], budgetMatch[2]) : null;
  if (budget) {
    if (budget >= 5_000_000) {
      applyAdjustments(signals, { spendPremium: 1.3, wagePremium: 1.12, confidence: 1.05 });
    } else if (budget >= 1_000_000) {
      applyAdjustments(signals, { spendPremium: 1.18, wagePremium: 1.05 });
    }
  }

  const trafficMatch = text.match(/(\d+(?:[.,]\d+)?)(?:\s|-)?(k|thousand)?\s*(?:daily|per day|a day)\s*(?:customers|visitors|guests|riders)/);
  const traffic = trafficMatch ? parseMagnitude(trafficMatch[1], trafficMatch[2]) : null;
  if (traffic) {
    if (traffic >= 800) {
      applyAdjustments(signals, { demandBoost: 1.3, spendPremium: 1.1 });
    } else if (traffic >= 300) {
      applyAdjustments(signals, { demandBoost: 1.16 });
    }
  }
}

function applyChannelSignals(text, signals) {
  if (text.includes("24/7") || text.includes("24-7") || text.includes("late night") || text.includes("late-night")) {
    applyAdjustments(signals, { demandBoost: 1.1, wagePremium: 1.04 });
  }

  if (text.includes("seasonal") || text.includes("temporary") || text.includes("pop-up")) {
    applyAdjustments(signals, { demandBoost: 0.88, confidence: 0.92 });
  }

  if (text.includes("drive-thru") || text.includes("drive thru") || text.includes("pick-up window")) {
    applyAdjustments(signals, { demandBoost: 1.08, confidence: 1.02 });
  }

  if (text.includes("delivery-only") || text.includes("ghost kitchen") || text.includes("virtual brand")) {
    applyAdjustments(signals, { demandBoost: 0.85, spendPremium: 1.02, confidence: 0.95 });
  }

  if (text.includes("catering") || text.includes("event space") || text.includes("banquet")) {
    applyAdjustments(signals, { demandBoost: 1.14, spendPremium: 1.18 });
  }

  if (text.includes("membership") || text.includes("subscription") || text.includes("loyalty program")) {
    applyAdjustments(signals, { spendPremium: 1.08, confidence: 1.03 });
  }
}
function parseMagnitude(value, unit = "") {
  if (!value) return null;
  const numeric = parseFloat(value.replace(/,/g, ""));
  if (Number.isNaN(numeric)) {
    return null;
  }
  const normalizedUnit = unit.trim().toLowerCase();
  if (normalizedUnit === "k" || normalizedUnit.includes("thousand")) {
    return numeric * 1_000;
  }
  if (normalizedUnit === "m" || normalizedUnit.includes("million")) {
    return numeric * 1_000_000;
  }
  return numeric;
}

function detectKeywordGroup(text, dictionary, fallback) {
  const normalized = text.toLowerCase();
  for (const [key, keywords] of Object.entries(dictionary)) {
    if (keywords.some((word) => normalized.includes(word))) {
      return key;
    }
  }
  return fallback;
}

function inferScaleFromContext(currentScale, text) {
  const normalized = text.toLowerCase();
  if (!normalized) {
    return currentScale || "medium";
  }

  let resolved = currentScale;
  if (!resolved || resolved === "medium") {
    const numericHint = detectScaleFromNumbers(normalized);
    if (numericHint) {
      resolved = numericHint;
    }
  }

  if ((!resolved || resolved === "medium") && SCALE_HINTS.large.some((word) => normalized.includes(word))) {
    resolved = "large";
  }
  if ((!resolved || resolved === "medium") && SCALE_HINTS.small.some((word) => normalized.includes(word))) {
    resolved = "small";
  }
  return resolved || "medium";
}

function deriveContextSignals(text = "") {
  const normalized = text.toLowerCase();
  const signals = { demandBoost: 1.0, spendPremium: 1.0, wagePremium: 1.0, confidence: 1.0 };
  if (!normalized) {
    return signals;
  }

  CONTEXT_RULES.forEach((rule) => {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      applyAdjustments(signals, rule.adjustments);
    }
  });

  applyQuantitativeSignals(normalized, signals);
  applyChannelSignals(normalized, signals);

  return {
    demandBoost: clamp(signals.demandBoost, 0.6, 1.7),
    spendPremium: clamp(signals.spendPremium, 0.65, 1.55),
    wagePremium: clamp(signals.wagePremium, 0.65, 1.4),
    confidence: clamp(signals.confidence, 0.7, 1.15),
  };
}

export function parseBusinessQuery({ query = "", businessType, scale, location }) {
  const normalizedQuery = query.toLowerCase();

  const resolvedBusinessType =
    businessType || detectKeywordGroup(normalizedQuery, BUSINESS_KEYWORDS, null);

  const detectedScale = scale || detectKeywordGroup(normalizedQuery, SCALE_KEYWORDS, null);
  const resolvedScale = inferScaleFromContext(detectedScale, normalizedQuery);

  const providedLocation = location ? resolveLocationKey(location) : null;
  const detectedLocation = providedLocation || findLocationInText(normalizedQuery);

  if (!resolvedBusinessType) {
    throw new Error("Unable to determine business type from request");
  }

  if (!detectedLocation) {
    throw new Error("Unable to determine target location");
  }

  return {
    businessType: resolvedBusinessType,
    scale: resolvedScale,
    locationKey: detectedLocation.key,
    locationLabel: getLocationLabel(detectedLocation.key),
    contextSignals: deriveContextSignals(normalizedQuery),
    query: query.trim() || null,
  };
}
