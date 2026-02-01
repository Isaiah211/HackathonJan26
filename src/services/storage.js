/**
 * Storage Service
 * Handles saving and loading scenarios to/from localStorage
 */

const STORAGE_KEY = 'impactiq_scenarios';
const STORAGE_VERSION = '1.0';

/**
 * Save scenario to localStorage
 * @param {object} scenario - Scenario data
 * @returns {boolean} - Success status
 */
export const saveScenario = (scenario) => {
  try {
    const scenarios = loadAllScenarios();
    const updatedScenarios = [...scenarios, scenario];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      scenarios: updatedScenarios,
      lastUpdated: new Date().toISOString()
    }));
    
    return true;
  } catch (error) {
    console.error('Failed to save scenario:', error);
    return false;
  }
};

/**
 * Load all scenarios from localStorage
 * @returns {array} - Array of scenarios
 */
export const loadAllScenarios = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    
    if (!data) {
      return [];
    }
    
    const parsed = JSON.parse(data);
    
    // Version check
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('Storage version mismatch, clearing old data');
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    
    return parsed.scenarios || [];
  } catch (error) {
    console.error('Failed to load scenarios:', error);
    return [];
  }
};

/**
 * Delete a scenario
 * @param {string} scenarioId - Scenario ID to delete
 * @returns {boolean} - Success status
 */
export const deleteScenario = (scenarioId) => {
  try {
    const scenarios = loadAllScenarios();
    const filteredScenarios = scenarios.filter(s => s.id !== scenarioId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      scenarios: filteredScenarios,
      lastUpdated: new Date().toISOString()
    }));
    
    return true;
  } catch (error) {
    console.error('Failed to delete scenario:', error);
    return false;
  }
};

/**
 * Clear all scenarios
 * @returns {boolean} - Success status
 */
export const clearAllScenarios = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear scenarios:', error);
    return false;
  }
};

/**
 * Export scenario data as JSON
 * @param {object} scenario - Scenario to export
 * @returns {string} - JSON string
 */
export const exportScenarioJSON = (scenario) => {
  return JSON.stringify(scenario, null, 2);
};

/**
 * Import scenario from JSON
 * @param {string} jsonString - JSON string
 * @returns {object|null} - Parsed scenario or null if invalid
 */
export const importScenarioJSON = (jsonString) => {
  try {
    const scenario = JSON.parse(jsonString);
    
    // Validate required fields
    if (!scenario.id || !scenario.businesses || !Array.isArray(scenario.businesses)) {
      throw new Error('Invalid scenario format');
    }
    
    return scenario;
  } catch (error) {
    console.error('Failed to import scenario:', error);
    return null;
  }
};

export default {
  saveScenario,
  loadAllScenarios,
  deleteScenario,
  clearAllScenarios,
  exportScenarioJSON,
  importScenarioJSON
};
