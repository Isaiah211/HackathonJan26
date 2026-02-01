const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const jsonHeaders = { 'Content-Type': 'application/json' };

function handleErrorResponse(status, payload) {
  const message = payload?.error || payload?.message || `Request failed with status ${status}`;
  const error = new Error(message);
  error.status = status;
  throw error;
}

export function mapCategoryToBusinessType(categoryId) {
  const normalized = (categoryId || '').toLowerCase();
  if (['restaurant'].includes(normalized)) return 'restaurant';
  if (['retail', 'grocery'].includes(normalized)) return normalized;
  if (['services', 'service', 'technology', 'education', 'hospitality', 'other'].includes(normalized)) return 'service';
  if (['entertainment'].includes(normalized)) return 'entertainment';
  if (['healthcare'].includes(normalized)) return 'healthcare';
  return 'service';
}

export function deriveScaleFromEmployees(employees) {
  const count = Number(employees) || 0;
  if (count <= 10) return 'small';
  if (count <= 50) return 'medium';
  return 'large';
}

export async function predictImpact({ businessType, scale, locationKey, locationLabel, contextSignals, query }) {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ businessType, scale, locationKey, locationLabel, contextSignals, query })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    handleErrorResponse(response.status, payload);
  }
  return payload;
}

export async function fetchAvailableLocations() {
  const response = await fetch(`${API_BASE_URL}/predict/locations`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    handleErrorResponse(response.status, payload);
  }
  return payload;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
