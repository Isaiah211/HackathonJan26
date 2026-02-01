import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import BusinessForm from './components/business/BusinessForm';
import LeafletMap from './components/map/LeafletMap';
import ResultsPanel from './components/business/ResultsPanel';
import { ToastProvider, useToast } from './components/ui/Toast';
import { predictBusinessImpact, getLocationProfileByCoordinates } from './utils/predictionEngine';
import { saveScenario, loadAllScenarios } from './services/storage';
import { generatePDF } from './services/pdfExport';
import { predictImpact, deriveScaleFromEmployees, mapCategoryToBusinessType } from './services/api';

const mapFeatureSnapshotToAreaData = (snapshot = {}, fallbackLabel = 'Selected Area') => {
  if (!snapshot || Object.keys(snapshot).length === 0) return null;
  return {
    name: fallbackLabel,
    populationDensity: Math.round((snapshot.population_density || 0) * 2.58999),
    medianIncome: Math.round(snapshot.median_income || 0),
    unemploymentRate: Math.round((snapshot.unemployment_rate || 0) * 1000) / 10,
    transitScore: Math.round(snapshot.transit_score || 0),
    existingBusinessCount: Math.round(snapshot.existing_business_count || 0)
  };
};

const mergeAnalyses = ({ business, localAnalysis, backendResponse, areaDataFallback }) => {
  const backendPrediction = backendResponse?.prediction;
  const areaData = backendPrediction?.feature_snapshot
    ? mapFeatureSnapshotToAreaData(backendPrediction.feature_snapshot, backendResponse?.input?.locationLabel)
    : areaDataFallback || localAnalysis.areaData;

  const jobsTotal = Math.round(backendPrediction?.jobs_created ?? localAnalysis.predictions.jobs.total);
  const directJobs = business.employees;
  const indirectJobs = Math.max(0, jobsTotal - directJobs);
  const jobs = {
    direct: directJobs,
    indirect: indirectJobs,
    total: Math.max(jobsTotal, directJobs + indirectJobs)
  };

  const footTraffic = backendPrediction?.foot_traffic != null
    ? Math.round(backendPrediction.foot_traffic * 10) / 10
    : localAnalysis.predictions.footTraffic;

  const localSpending = backendPrediction?.local_spending != null
    ? Math.round(backendPrediction.local_spending / 1000)
    : localAnalysis.predictions.localSpending;

  const revenueFromBackend = backendPrediction?.local_spending
    ? Math.round((backendPrediction.local_spending / 0.65) / 1000)
    : null;
  const revenue = revenueFromBackend || localAnalysis.predictions.revenue;

  const taxRevenue = {
    sales: backendPrediction?.sales_tax != null ? Math.round(backendPrediction.sales_tax / 1000) : localAnalysis.predictions.taxRevenue.sales,
    property: localAnalysis.predictions.taxRevenue.property,
    income: localAnalysis.predictions.taxRevenue.income
  };
  taxRevenue.total = taxRevenue.sales + taxRevenue.property + taxRevenue.income;

  return {
    predictions: {
      jobs,
      revenue,
      footTraffic,
      taxRevenue,
      localSpending,
      impactRadius: localAnalysis.predictions.impactRadius
    },
    areaData,
    explanation: backendResponse?.summary || localAnalysis.explanation,
    timestamp: backendResponse?.generatedAt || localAnalysis.timestamp
  };
};

/**
 * Main App Component - ImpactLens
 * Professional business impact simulation and site selection tool
 */
function AppContent() {
  const [businesses, setBusinesses] = useState([]);
  const [pendingBusiness, setPendingBusiness] = useState(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [scenarioName, setScenarioName] = useState('New Scenario');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { toast } = useToast();

  // Load saved scenarios on mount
  useEffect(() => {
    const saved = loadAllScenarios();
    if (saved.length > 0) {
      toast.info(`${saved.length} saved scenario${saved.length > 1 ? 's' : ''} available`);
    }
  }, []);

  /**
   * Handle adding new business (from form)
   */
  const handleAddBusiness = (business) => {
    setPendingBusiness(business);
    toast.info(`Place ${business.name} on the map`, 3000);
  };

  /**
   * Handle placing business on map
   */
  const handleBusinessPlace = async (location) => {
    if (!pendingBusiness) return;

    setIsAnalyzing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const locationProfile = getLocationProfileByCoordinates(location.lng, location.lat);

      if (!locationProfile.areaData || locationProfile.key === 'default') {
        toast.warning('Please pick a location within the Capital Region coverage area.');
        setIsAnalyzing(false);
        return;
      }

      let address = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?` +
          `format=json&` +
          `lat=${location.lat}&` +
          `lon=${location.lng}&` +
          `zoom=18&` +
          `addressdetails=1`
        );
        const data = await response.json();
        if (data.display_name) {
          address = data.display_name;
        }
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
      }

      const localAnalysis = predictBusinessImpact(
        pendingBusiness,
        {
          lng: location.lng,
          lat: location.lat,
          neighborhood: locationProfile.key,
          locationKey: locationProfile.key,
          address
        }
      );

      let backendResponse = null;
      try {
        backendResponse = await predictImpact({
          businessType: mapCategoryToBusinessType(pendingBusiness.categoryId),
          scale: deriveScaleFromEmployees(pendingBusiness.employees),
          locationKey: locationProfile.key,
          locationLabel: locationProfile.label,
          query: pendingBusiness.name
        });
      } catch (error) {
        console.error('Backend prediction failed, using local analysis:', error);
        toast.warning('Using local analysis due to prediction service issue');
      }

      const mergedAnalysis = mergeAnalyses({
        business: pendingBusiness,
        localAnalysis,
        backendResponse,
        areaDataFallback: locationProfile.areaData
      });

      const completeBusiness = {
        ...pendingBusiness,
        location: {
          lng: location.lng,
          lat: location.lat,
          address,
          neighborhood: locationProfile.key,
          locationLabel: locationProfile.label
        },
        predictions: mergedAnalysis.predictions,
        areaData: mergedAnalysis.areaData,
        explanation: mergedAnalysis.explanation,
        analyzedAt: mergedAnalysis.timestamp
      };

      setBusinesses(prev => [...prev, completeBusiness]);
      setSelectedBusinessId(completeBusiness.id);
      setPendingBusiness(null);

      toast.success(`${completeBusiness.name} added successfully!`);
    } catch (error) {
      console.error('Error analyzing business:', error);
      toast.error('Failed to analyze business. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Handle saving scenario
   */
  const handleSaveScenario = () => {
    if (businesses.length === 0) {
      toast.warning('No businesses to save');
      return;
    }

    const scenario = {
      id: `scenario_${Date.now()}`,
      name: scenarioName,
      businesses,
      createdAt: new Date().toISOString()
    };

    const success = saveScenario(scenario);
    
    if (success) {
      toast.success('Scenario saved successfully!');
    } else {
      toast.error('Failed to save scenario');
    }
  };

  /**
   * Handle loading scenarios
   */
  const handleLoadScenario = () => {
    const scenarios = loadAllScenarios();
    
    if (scenarios.length === 0) {
      toast.info('No saved scenarios found');
      return;
    }

    // For demo, load the most recent scenario
    const mostRecent = scenarios[scenarios.length - 1];
    setBusinesses(mostRecent.businesses);
    setScenarioName(mostRecent.name);
    toast.success(`Loaded scenario: ${mostRecent.name}`);
  };

  /**
   * Handle exporting to PDF
   */
  const handleExportPDF = async () => {
    if (businesses.length === 0) {
      toast.warning('No businesses to export');
      return;
    }

    toast.info('Generating PDF...', 2000);

    const scenario = {
      name: scenarioName,
      businesses
    };

    const result = await generatePDF(scenario);

    if (result.success) {
      toast.success(`PDF exported: ${result.filename}`);
    } else {
      toast.error('Failed to export PDF');
    }
  };

  /**
   * Handle business selection
   */
  const handleBusinessSelect = (business) => {
    setSelectedBusinessId(business.id);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <Header
        onSave={handleSaveScenario}
        onLoad={handleLoadScenario}
        onExport={handleExportPDF}
        hasScenarios={businesses.length > 0}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left sidebar - Business form */}
        <aside className="w-full lg:w-96 bg-white border-r border-neutral-200 overflow-y-auto p-6 no-print">
          <BusinessForm
            onAddBusiness={handleAddBusiness}
            isMapReady={!pendingBusiness}
          />

          {/* Business list */}
          {businesses.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                Added Businesses ({businesses.length})
              </h3>
              <div className="space-y-2">
                {businesses.map((business) => (
                  <button
                    key={business.id}
                    onClick={() => handleBusinessSelect(business)}
                    className={`w-full text-left p-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      selectedBusinessId === business.id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: business.category?.color || '#6366f1' }}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {business.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {business.employees} employees • {business.category?.label}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Center - Map */}
        <div className="flex-1 p-4 lg:p-6 overflow-hidden relative">
          <LeafletMap
            businesses={businesses}
            onBusinessPlace={handleBusinessPlace}
            pendingBusiness={pendingBusiness}
            onBusinessSelect={handleBusinessSelect}
          />
          
          {isAnalyzing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
              <div className="bg-white p-8 rounded-xl shadow-xl text-center">
                <div className="spinner w-12 h-12 mx-auto mb-4 text-brand-600" />
                <p className="text-lg font-semibold text-neutral-900 mb-1">
                  Analyzing Impact...
                </p>
                <p className="text-sm text-neutral-600">
                  Processing demographics, competition, and economic factors
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - Results */}
        <aside className="w-full lg:w-[420px] bg-white border-l border-neutral-200 overflow-hidden no-print">
          <ResultsPanel
            businesses={businesses}
            selectedBusinessId={selectedBusinessId}
            onExportPDF={handleExportPDF}
          />
        </aside>
      </main>
    </div>
  );
}

/**
 * App wrapper with Toast Provider
 */
function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
