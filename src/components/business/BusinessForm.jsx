import React, { useState, useEffect } from 'react';
import { Building2, Users, Tag, MapPin, Plus } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { HelpTooltip } from '../ui/Tooltip';
import { 
  detectBusinessCategory, 
  BUSINESS_CATEGORIES, 
  validateBusinessName, 
  validateEmployeeCount 
} from '../../utils/businessCategories';

/**
 * BusinessForm Component
 * Form for entering business details with auto category detection
 * NOTE: Multipliers are NOT displayed to users (professional standard)
 */
const BusinessForm = ({ onAddBusiness, isMapReady }) => {
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    employees: ''
  });
  
  const [errors, setErrors] = useState({});
  const [detectedCategory, setDetectedCategory] = useState(null);
  const [showCategoryOverride, setShowCategoryOverride] = useState(false);

  // Auto-detect category when business name changes
  useEffect(() => {
    if (formData.name.length >= 3) {
      const detected = detectBusinessCategory(formData.name);
      setDetectedCategory(detected);
      
      // Auto-fill category if detected and not manually overridden
      if (detected && !showCategoryOverride) {
        setFormData(prev => ({ ...prev, categoryId: detected.id }));
      }
    } else {
      setDetectedCategory(null);
    }
  }, [formData.name, showCategoryOverride]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate business name
    const nameValidation = validateBusinessName(formData.name);
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error;
    }
    
    // Validate category
    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a business category';
    }
    
    // Validate employees
    const employeeValidation = validateEmployeeCount(formData.employees);
    if (!employeeValidation.valid) {
      newErrors.employees = employeeValidation.error;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const business = {
      id: `business_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name.trim(),
      categoryId: formData.categoryId,
      category: BUSINESS_CATEGORIES.find(c => c.id === formData.categoryId),
      employees: parseInt(formData.employees, 10),
      createdAt: new Date().toISOString()
    };
    
    onAddBusiness(business);
    
    // Reset form
    setFormData({ name: '', categoryId: '', employees: '' });
    setDetectedCategory(null);
    setShowCategoryOverride(false);
    setErrors({});
  };

  const selectedCategory = BUSINESS_CATEGORIES.find(c => c.id === formData.categoryId);

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-600" />
          Add Business
        </h2>
        <HelpTooltip content="Enter business details to analyze economic impact" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Business Name */}
        <Input
          id="business-name"
          label="Business Name"
          type="text"
          placeholder="e.g., Joe's Coffee Shop"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          required
          leftIcon={<Building2 className="w-4 h-4" />}
          aria-describedby="name-help"
        />

        {/* Auto-detected Category Banner */}
        {detectedCategory && !showCategoryOverride && (
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 flex items-start gap-3 animate-slide-down">
            <div className="flex-shrink-0 w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
              <Tag className="w-4 h-4 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-900">
                Auto-detected: {detectedCategory.label}
              </p>
              <button
                type="button"
                onClick={() => setShowCategoryOverride(true)}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-1"
              >
                Change category
              </button>
            </div>
          </div>
        )}

        {/* Manual Category Selection */}
        {(!detectedCategory || showCategoryOverride) && (
          <div>
            <label htmlFor="category" className="label flex items-center gap-2">
              Business Category
              <span className="text-accent-500">*</span>
              <HelpTooltip content="Select the category that best describes your business" />
            </label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              className={`input ${errors.categoryId ? 'input-error' : ''}`}
              aria-invalid={Boolean(errors.categoryId)}
              aria-describedby={errors.categoryId ? 'category-error' : undefined}
            >
              <option value="">Select a category...</option>
              {BUSINESS_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p id="category-error" className="mt-2 text-sm text-accent-600 flex items-center gap-1" role="alert">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.categoryId}
              </p>
            )}
          </div>
        )}

        {/* Selected Category Display - WITHOUT MULTIPLIERS */}
        {selectedCategory && (
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: selectedCategory.color }}
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium text-neutral-900">{selectedCategory.label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Impact analysis will be tailored to this business type
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Number of Employees */}
        <Input
          id="employees"
          label="Number of Employees"
          type="number"
          min="1"
          max="10000"
          placeholder="e.g., 15"
          value={formData.employees}
          onChange={(e) => handleChange('employees', e.target.value)}
          error={errors.employees}
          helpText="Estimated number of employees at this location"
          required
          leftIcon={<Users className="w-4 h-4" />}
        />

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            leftIcon={isMapReady ? <MapPin className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          >
            {isMapReady ? 'Place on Map' : 'Add Business'}
          </Button>
          
          {isMapReady && (
            <p className="mt-2 text-xs text-neutral-500 text-center">
              Click on the map to place this business and see impact analysis
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default BusinessForm;
