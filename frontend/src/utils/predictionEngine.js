/**
 * Business Impact Prediction Engine
 * Calculates economic impact metrics based on business type, size, and location
 */

import { getCategoryById } from './businessCategories';

// Demographic data for Capital Region neighborhoods
const NEIGHBORHOOD_DATA = {
  'downtown-albany': {
    name: 'Downtown Albany',
    populationDensity: 8500,
    medianIncome: 42000,
    unemploymentRate: 6.2,
    transitScore: 85,
    existingBusinessCount: 450,
    coordinates: [-73.7562, 42.6526]
  },
  'downtown-troy': {
    name: 'Downtown Troy',
    populationDensity: 7200,
    medianIncome: 38000,
    unemploymentRate: 7.1,
    transitScore: 72,
    existingBusinessCount: 280,
    coordinates: [-73.6918, 42.7284]
  },
  'pine-hills': {
    name: 'Pine Hills',
    populationDensity: 9100,
    medianIncome: 35000,
    unemploymentRate: 8.5,
    transitScore: 68,
    existingBusinessCount: 320,
    coordinates: [-73.8200, 42.6800]
  },
  'default': {
    name: 'Capital Region',
    populationDensity: 6500,
    medianIncome: 45000,
    unemploymentRate: 5.8,
    transitScore: 60,
    existingBusinessCount: 200,
    coordinates: [-73.7562, 42.6526]
  }
};

/**
 * Calculate jobs created
 */
const calculateJobs = (employees, categoryMultiplier, areaData) => {
  // Direct jobs from input
  const directJobs = employees;
  
  // Indirect jobs based on multiplier effect (supply chain, support services)
  // Higher unemployment areas benefit more from indirect job creation
  const unemploymentFactor = 1 + (areaData.unemploymentRate / 100);
  const indirectJobs = Math.round(directJobs * 0.3 * unemploymentFactor * categoryMultiplier);
  
  return {
    direct: directJobs,
    indirect: indirectJobs,
    total: directJobs + indirectJobs
  };
};

/**
 * Calculate annual revenue
 */
const calculateRevenue = (employees, categoryId, categoryMultiplier, areaData) => {
  // Base revenue per employee varies by category (in thousands)
  const baseRevenuePerEmployee = {
    restaurant: 65,
    retail: 80,
    grocery: 150,
    healthcare: 120,
    services: 90,
    entertainment: 75,
    technology: 180,
    education: 55,
    hospitality: 140,
    other: 85
  };
  
  const baseRevenue = (baseRevenuePerEmployee[categoryId] || 85) * employees;
  
  // Adjust for area median income (purchasing power)
  const incomeFactor = areaData.medianIncome / 42000; // Normalize to $42k
  
  // Adjust for competition (market saturation)
  const competitionFactor = Math.max(0.6, 1 - (areaData.existingBusinessCount / 1000));
  
  const totalRevenue = Math.round(baseRevenue * categoryMultiplier * incomeFactor * competitionFactor);
  
  return totalRevenue;
};

/**
 * Calculate foot traffic increase
 */
const calculateFootTraffic = (categoryId, categoryMultiplier, areaData) => {
  // Base foot traffic increase by category (percentage)
  const baseTraffic = {
    restaurant: 18,
    retail: 22,
    grocery: 32,
    healthcare: 12,
    services: 8,
    entertainment: 25,
    technology: 5,
    education: 15,
    hospitality: 20,
    other: 10
  };
  
  let traffic = baseTraffic[categoryId] || 10;
  
  // Adjust for transit score (better transit = more foot traffic)
  const transitFactor = areaData.transitScore / 70;
  
  // Adjust for population density
  const densityFactor = Math.min(1.5, areaData.populationDensity / 7000);
  
  return Math.round(traffic * categoryMultiplier * transitFactor * densityFactor * 10) / 10;
};

/**
 * Calculate tax revenue
 */
const calculateTaxRevenue = (revenue, jobs, categoryId) => {
  // Sales tax (8% average in NY)
  const salesTax = Math.round(revenue * 0.08);
  
  // Property tax (estimated based on business size)
  const propertyTax = Math.round(jobs * 2.5); // $2.5k per employee estimate
  
  // Income tax from employees (NY state ~4% effective rate)
  const avgSalary = 40; // $40k average
  const incomeTax = Math.round(jobs * avgSalary * 0.04);
  
  return {
    sales: salesTax,
    property: propertyTax,
    income: incomeTax,
    total: salesTax + propertyTax + incomeTax
  };
};

/**
 * Calculate local spending increase
 */
const calculateLocalSpending = (revenue, categoryId) => {
  // Percentage of revenue that stays local
  const localRetentionRates = {
    restaurant: 0.75,
    retail: 0.55,
    grocery: 0.65,
    healthcare: 0.80,
    services: 0.85,
    entertainment: 0.70,
    technology: 0.60,
    education: 0.75,
    hospitality: 0.70,
    other: 0.65
  };
  
  const retentionRate = localRetentionRates[categoryId] || 0.65;
  return Math.round(revenue * retentionRate);
};

/**
 * Calculate impact radius (meters)
 */
const calculateImpactRadius = (categoryId, employees) => {
  const baseRadius = {
    restaurant: 400,
    retail: 500,
    grocery: 800,
    healthcare: 600,
    services: 350,
    entertainment: 450,
    technology: 300,
    education: 700,
    hospitality: 500,
    other: 400
  };
  
  const base = baseRadius[categoryId] || 400;
  const sizeFactor = Math.min(2, 1 + (employees / 100));
  
  return Math.round(base * sizeFactor);
};

/**
 * Generate explanation text
 */
const generateExplanation = (business, predictions, areaData) => {
  const category = getCategoryById(business.categoryId);
  
  return `Based on ${areaData.name}'s characteristics—population density of ${areaData.populationDensity.toLocaleString()} per sq mi, median income of $${areaData.medianIncome.toLocaleString()}, and ${areaData.existingBusinessCount} existing businesses—${business.name} (${category.label}) with ${business.employees} employees is projected to create ${predictions.jobs.total} total jobs (${predictions.jobs.direct} direct, ${predictions.jobs.indirect} indirect through multiplier effects).

The business is estimated to generate $${predictions.revenue.toLocaleString()}k in annual revenue, accounting for local purchasing power and market competition. With a transit score of ${areaData.transitScore}, the area supports strong accessibility, contributing to a ${predictions.footTraffic}% increase in local foot traffic.

Tax revenue contributions are projected at $${predictions.taxRevenue.total}k annually, including sales tax ($${predictions.taxRevenue.sales}k), property tax ($${predictions.taxRevenue.property}k), and income tax from employees ($${predictions.taxRevenue.income}k).

Local economic impact extends to approximately $${predictions.localSpending}k in annual local spending, with multiplier effects benefiting nearby businesses through supply chain relationships and employee expenditures within the community.`;
};

/**
 * Main prediction function
 * @param {object} business - Business data (name, categoryId, employees)
 * @param {object} location - Location data (lat, lng, neighborhood)
 * @returns {object} - Predictions and analysis
 */
export const predictBusinessImpact = (business, location) => {
  // Get area data
  const areaData = NEIGHBORHOOD_DATA[location.neighborhood] || NEIGHBORHOOD_DATA.default;
  
  // Get category multipliers
  const category = getCategoryById(business.categoryId);
  const multipliers = category.impactMultipliers;
  
  // Calculate all metrics
  const jobs = calculateJobs(business.employees, multipliers.jobs, areaData);
  const revenue = calculateRevenue(business.employees, business.categoryId, multipliers.revenue, areaData);
  const footTraffic = calculateFootTraffic(business.categoryId, multipliers.traffic, areaData);
  const taxRevenue = calculateTaxRevenue(revenue, jobs.direct, business.categoryId);
  const localSpending = calculateLocalSpending(revenue, business.categoryId);
  const impactRadius = calculateImpactRadius(business.categoryId, business.employees);
  
  const predictions = {
    jobs,
    revenue,
    footTraffic,
    taxRevenue,
    localSpending,
    impactRadius
  };
  
  return {
    businessId: business.id,
    predictions,
    areaData,
    explanation: generateExplanation(business, predictions, areaData),
    timestamp: new Date().toISOString()
  };
};

/**
 * Get neighborhood data by coordinates
 * In production, this would use reverse geocoding API
 */
export const getNeighborhoodByCoordinates = (lng, lat) => {
  // Simple distance calculation to nearest known neighborhood
  let nearest = 'default';
  let minDistance = Infinity;
  
  Object.entries(NEIGHBORHOOD_DATA).forEach(([id, data]) => {
    if (id === 'default') return;
    
    const [nLng, nLat] = data.coordinates;
    const distance = Math.sqrt(
      Math.pow(lat - nLat, 2) + Math.pow(lng - nLng, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = id;
    }
  });
  
  return nearest;
};

export default {
  predictBusinessImpact,
  getNeighborhoodByCoordinates,
  NEIGHBORHOOD_DATA
};
