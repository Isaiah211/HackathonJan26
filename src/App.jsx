import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import BusinessForm from './components/business/BusinessForm';
import LeafletMap from './components/map/LeafletMap';
import ResultsPanel from './components/business/ResultsPanel';
import { ToastProvider, useToast } from './components/ui/Toast';
import { predictBusinessImpact, getNeighborhoodByCoordinates } from './utils/predictionEngine';
import { saveScenario, loadAllScenarios } from './services/storage';
import { generatePDF } from './services/pdfExport';

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
      // Simulate API delay for realistic UX
      await new Promise(resolve => setTimeout(resolve, 800));

      // Get neighborhood from coordinates
      const neighborhoodId = getNeighborhoodByCoordinates(location.lng, location.lat);

      // Get address from reverse geocoding using Nominatim
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

      // Calculate impact predictions
      const analysis = predictBusinessImpact(
        pendingBusiness,
        {
          lng: location.lng,
          lat: location.lat,
          neighborhood: neighborhoodId,
          address
        }
      );

      // Create complete business object
      const completeBusiness = {
        ...pendingBusiness,
        location: {
          lng: location.lng,
          lat: location.lat,
          address,
          neighborhood: neighborhoodId
        },
        predictions: analysis.predictions,
        areaData: analysis.areaData,
        explanation: analysis.explanation,
        analyzedAt: analysis.timestamp
      };

      // Add to businesses list
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
