import React, { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Users, DollarSign, TrendingDown, ChevronDown, ChevronUp, Building2, FileText } from 'lucide-react';
import Button from '../ui/Button';
import { formatCurrencyFromThousands, formatPercent, formatNumber } from '../../utils/formatters';

/**
 * Metric Card Component
 */
const MetricCard = ({ icon: Icon, label, value, detail, color = 'brand', trend }) => {
  const colorClasses = {
    brand: 'bg-brand-50 text-brand-700',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-yellow-50 text-yellow-700',
    accent: 'bg-accent-50 text-accent-700'
  };

  return (
    <div className="card p-5 card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? 'text-success-600' : 'text-accent-600'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-neutral-900 mb-1">{value}</p>
        <p className="text-sm font-medium text-neutral-600 mb-0.5">{label}</p>
        {detail && <p className="text-xs text-neutral-500">{detail}</p>}
      </div>
    </div>
  );
};

/**
 * Collapsible Section Component
 */
const CollapsibleSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-brand-500"
        aria-expanded={isOpen}
      >
        <h3 className="font-semibold text-neutral-900">{title}</h3>
        {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
      </button>
      {isOpen && (
        <div className="p-4 bg-white animate-slide-down">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * ResultsPanel Component
 * Displays impact analysis for selected business(es)
 */
const ResultsPanel = ({ businesses = [], selectedBusinessId, onExportPDF }) => {
  const activeBusiness = selectedBusinessId 
    ? businesses.find(b => b.id === selectedBusinessId)
    : businesses[businesses.length - 1];

  // Calculate aggregate metrics if multiple businesses
  const aggregateMetrics = businesses.reduce((acc, business) => {
    if (!business.predictions) return acc;
    
    const p = business.predictions;
    return {
      totalJobs: acc.totalJobs + p.jobs.total,
      totalRevenue: acc.totalRevenue + p.revenue,
      totalTax: acc.totalTax + p.taxRevenue.total,
      totalSpending: acc.totalSpending + p.localSpending,
      avgFootTraffic: acc.avgFootTraffic + p.footTraffic
    };
  }, { totalJobs: 0, totalRevenue: 0, totalTax: 0, totalSpending: 0, avgFootTraffic: 0 });

  if (businesses.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Analysis Yet</h3>
          <p className="text-sm text-neutral-600">
            Add a business and place it on the map to see detailed impact predictions and economic analysis.
          </p>
        </div>
      </div>
    );
  }

  if (!activeBusiness || !activeBusiness.predictions) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="spinner w-12 h-12 mx-auto mb-4 text-brand-600" />
          <p className="text-sm text-neutral-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  const { predictions, areaData, explanation } = activeBusiness;

  // Prepare chart data
  const jobsData = [
    { name: 'Direct', value: predictions.jobs.direct, fill: '#6366f1' },
    { name: 'Indirect', value: predictions.jobs.indirect, fill: '#10b981' }
  ];

  const taxData = [
    { name: 'Sales Tax', value: predictions.taxRevenue.sales, fill: '#6366f1' },
    { name: 'Property Tax', value: predictions.taxRevenue.property, fill: '#10b981' },
    { name: 'Income Tax', value: predictions.taxRevenue.income, fill: '#f59e0b' }
  ];

  const multiBusinessData = businesses
    .filter(b => b.predictions)
    .map(b => ({
      name: b.name.length > 15 ? b.name.substring(0, 12) + '...' : b.name,
      jobs: b.predictions.jobs.total,
      revenue: b.predictions.revenue
    }));

  return (
    <div className="h-full overflow-y-auto scrollbar-thin" id="results-panel">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-1">
              Impact Analysis
            </h2>
            <p className="text-sm text-neutral-600">
              {activeBusiness.name} • {activeBusiness.category?.label}
            </p>
          </div>
          <span className="badge badge-brand">AI Prediction</span>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            icon={Users}
            label="Jobs Created"
            value={predictions.jobs.total}
            detail={`${predictions.jobs.direct} direct + ${predictions.jobs.indirect} indirect`}
            color="brand"
          />
          <MetricCard
            icon={DollarSign}
            label="Annual Revenue"
            value={formatCurrencyFromThousands(predictions.revenue)}
            detail="Estimated gross revenue"
            color="success"
          />
          <MetricCard
            icon={TrendingUp}
            label="Foot Traffic"
            value={`+${formatPercent(predictions.footTraffic, 1)}`}
            detail="Increase in area"
            color="warning"
          />
          <MetricCard
            icon={DollarSign}
            label="Tax Revenue"
            value={formatCurrencyFromThousands(predictions.taxRevenue.total)}
            detail="Annual to city"
            color="accent"
          />
        </div>

        {/* Multi-business comparison */}
        {businesses.length > 1 && (
          <CollapsibleSection title="Business Comparison" defaultOpen={true}>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={multiBusinessData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="jobs" fill="#6366f1" name="Total Jobs" />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-neutral-600 mb-1">Total Jobs</p>
                  <p className="text-lg font-bold text-neutral-900">{aggregateMetrics.totalJobs}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-neutral-600 mb-1">Total Revenue</p>
                  <p className="text-lg font-bold text-neutral-900">{formatCurrencyFromThousands(aggregateMetrics.totalRevenue)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-neutral-600 mb-1">Total Tax</p>
                  <p className="text-lg font-bold text-neutral-900">{formatCurrencyFromThousands(aggregateMetrics.totalTax)}</p>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Charts */}
        <CollapsibleSection title="Detailed Metrics">
          <div className="space-y-6">
            {/* Jobs Breakdown */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">Job Creation Breakdown</h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={jobsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tax Distribution */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">Tax Revenue Distribution</h4>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={taxData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${formatCurrencyFromThousands(entry.value)}`}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {taxData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CollapsibleSection>

        {/* Economic Impact Details */}
        <CollapsibleSection title="Economic Impact Details">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-500 mb-1">Local Spending Impact</p>
              <p className="text-lg font-semibold text-neutral-900">{formatCurrencyFromThousands(predictions.localSpending)} / year</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Area Median Income</p>
              <p className="text-lg font-semibold text-neutral-900">${formatNumber(areaData.medianIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Population Density</p>
              <p className="text-lg font-semibold text-neutral-900">{formatNumber(areaData.populationDensity)}/mi²</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Transit Score</p>
              <p className="text-lg font-semibold text-neutral-900">{formatNumber(areaData.transitScore)}/100</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Existing Businesses</p>
              <p className="text-lg font-semibold text-neutral-900">{formatNumber(areaData.existingBusinessCount)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Unemployment Rate</p>
              <p className="text-lg font-semibold text-neutral-900">{formatPercent(areaData.unemploymentRate, 1)}</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* AI Analysis */}
        <CollapsibleSection title="AI Analysis Summary">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
              {explanation}
            </p>
          </div>
        </CollapsibleSection>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs text-amber-900 leading-relaxed">
            <strong>Disclaimer:</strong> These predictions are estimates based on demographic data, economic indicators, and predictive models. Actual results may vary based on business execution, market conditions, and external factors. This analysis is for informational purposes only.
          </p>
        </div>

        {/* Export Button */}
        <Button
          variant="secondary"
          className="w-full"
          onClick={onExportPDF}
          leftIcon={<FileText className="w-4 h-4" />}
        >
          Export Analysis to PDF
        </Button>
      </div>
    </div>
  );
};

export default ResultsPanel;
