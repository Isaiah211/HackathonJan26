/**
 * Business Category Detection Service
 * Auto-detects business category from business name using keyword matching
 */

export const BUSINESS_CATEGORIES = [
  {
    id: 'restaurant',
    label: 'Restaurant & Dining',
    keywords: ['restaurant', 'cafe', 'coffee', 'diner', 'bistro', 'eatery', 'grill', 'kitchen', 'food', 'dining', 'pizza', 'burger', 'sushi', 'taco', 'bbq', 'steakhouse', 'bar', 'pub', 'brewery', 'tavern'],
    color: '#ef4444',
    impactMultipliers: { jobs: 1.0, revenue: 1.0, traffic: 1.3 }
  },
  {
    id: 'retail',
    label: 'Retail & Shopping',
    keywords: ['store', 'shop', 'boutique', 'market', 'retail', 'outlet', 'mart', 'clothing', 'fashion', 'apparel', 'shoes', 'accessories', 'electronics', 'books', 'toys', 'gifts', 'furniture'],
    color: '#f59e0b',
    impactMultipliers: { jobs: 1.0, revenue: 1.0, traffic: 1.2 }
  },
  {
    id: 'grocery',
    label: 'Grocery & Convenience',
    keywords: ['grocery', 'supermarket', 'convenience', 'bodega', 'deli', 'mart', 'market', 'produce', 'organic', 'fresh', 'foods'],
    color: '#10b981',
    impactMultipliers: { jobs: 1.0, revenue: 1.0, traffic: 1.5 }
  },
  {
    id: 'healthcare',
    label: 'Healthcare & Wellness',
    keywords: ['clinic', 'medical', 'health', 'doctor', 'dental', 'dentist', 'pharmacy', 'wellness', 'fitness', 'gym', 'yoga', 'spa', 'therapy', 'care', 'hospital'],
    color: '#3b82f6',
    impactMultipliers: { jobs: 1.0, revenue: 1.0, traffic: 0.9 }
  },
  {
    id: 'services',
    label: 'Professional Services',
    keywords: ['bank', 'finance', 'insurance', 'law', 'legal', 'accounting', 'consulting', 'agency', 'office', 'services', 'salon', 'barber', 'laundry', 'cleaning', 'repair'],
    color: '#8b5cf6',
    impactMultipliers: { jobs: 1.0, revenue: 1.0, traffic: 0.8 }
  },
  {
    id: 'entertainment',
    label: 'Entertainment & Leisure',
    keywords: ['cinema', 'theater', 'entertainment', 'arcade', 'bowling', 'sports', 'recreation', 'park', 'museum', 'gallery', 'studio', 'music', 'arts'],
    color: '#ec4899',
    impactMultipliers: { jobs: 1.0, revenue: 1.0, traffic: 1.4 }
  },
  {
    id: 'technology',
    label: 'Technology & Innovation',
    keywords: ['tech', 'software', 'digital', 'computer', 'IT', 'data', 'analytics', 'AI', 'startup', 'innovation', 'lab', 'research', 'development'],
    color: '#06b6d4',
    impactMultipliers: { jobs: 1.0, revenue: 1.0, traffic: 0.7 }
  },
  {
    id: 'education',
    label: 'Education & Training',
    keywords: ['school', 'academy', 'learning', 'education', 'training', 'tutoring', 'college', 'university', 'institute', 'center', 'workshop'],
    color: '#f97316',
    impactMultipliers: { jobs: 1.0, revenue: 1.0, traffic: 1.0 }
  },
  {
    id: 'hospitality',
    label: 'Hospitality & Lodging',
    keywords: ['hotel', 'motel', 'inn', 'lodge', 'resort', 'hostel', 'accommodation', 'stay', 'hospitality'],
    color: '#14b8a6',
    impactMultipliers: { jobs: 1.0, revenue: 1.0, traffic: 1.1 }
  },
  {
    id: 'other',
    label: 'Other Business',
    keywords: [],
    color: '#6b7280',
    impactMultipliers: { jobs: 1.0, revenue: 1.0, traffic: 1.0 }
  }
];

/**
 * Detects business category from business name
 * @param {string} businessName - The name of the business
 * @returns {object} - Detected category object or null
 */
export const detectBusinessCategory = (businessName) => {
  if (!businessName || typeof businessName !== 'string') {
    return null;
  }

  const nameLower = businessName.toLowerCase().trim();
  
  // Try to find a matching category based on keywords
  for (const category of BUSINESS_CATEGORIES) {
    if (category.id === 'other') continue;
    
    for (const keyword of category.keywords) {
      if (nameLower.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  return null;
};

/**
 * Gets category by ID
 * @param {string} categoryId - Category ID
 * @returns {object} - Category object
 */
export const getCategoryById = (categoryId) => {
  return BUSINESS_CATEGORIES.find(cat => cat.id === categoryId) || BUSINESS_CATEGORIES[BUSINESS_CATEGORIES.length - 1];
};

/**
 * Validates business name
 * @param {string} name - Business name
 * @returns {object} - Validation result
 */
export const validateBusinessName = (name) => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Business name is required' };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, error: 'Business name must be at least 2 characters' };
  }
  
  if (name.length > 100) {
    return { valid: false, error: 'Business name must be less than 100 characters' };
  }
  
  return { valid: true, error: null };
};

/**
 * Validates employee count
 * @param {number} count - Number of employees
 * @returns {object} - Validation result
 */
export const validateEmployeeCount = (count) => {
  const num = parseInt(count, 10);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Please enter a valid number' };
  }
  
  if (num < 1) {
    return { valid: false, error: 'Employee count must be at least 1' };
  }
  
  if (num > 10000) {
    return { valid: false, error: 'Employee count seems unrealistic (max 10,000)' };
  }
  
  return { valid: true, error: null };
};

export default {
  BUSINESS_CATEGORIES,
  detectBusinessCategory,
  getCategoryById,
  validateBusinessName,
  validateEmployeeCount
};
