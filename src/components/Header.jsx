import React from 'react';
import { Save, Upload, FileDown, Settings, HelpCircle } from 'lucide-react';
import Logo from './Logo';
import Button from './Button';
import { Tooltip } from './Tooltip';

/**
 * Header Component
 * Main application header with branding and actions
 */
const Header = ({ onSave, onLoad, onExport, hasScenarios }) => {
  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and branding */}
          <Logo size="default" showText={true} />

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Tooltip content="Save current scenario">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                disabled={!hasScenarios}
                leftIcon={<Save className="w-4 h-4" />}
                aria-label="Save scenario"
              >
                <span className="hidden sm:inline">Save</span>
              </Button>
            </Tooltip>

            <Tooltip content="Load saved scenario">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLoad}
                leftIcon={<Upload className="w-4 h-4" />}
                aria-label="Load scenario"
              >
                <span className="hidden sm:inline">Load</span>
              </Button>
            </Tooltip>

            <Tooltip content="Export to PDF">
              <Button
                variant="ghost"
                size="sm"
                onClick={onExport}
                disabled={!hasScenarios}
                leftIcon={<FileDown className="w-4 h-4" />}
                aria-label="Export to PDF"
              >
                <span className="hidden sm:inline">Export</span>
              </Button>
            </Tooltip>

            <div className="hidden lg:flex items-center gap-3 ml-3 pl-3 border-l border-neutral-200">
              <Tooltip content="Help & Documentation">
                <button
                  className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                  aria-label="Help"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </Tooltip>

              <Tooltip content="Settings">
                <button
                  className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Subtitle / tagline */}
        <p className="text-sm text-neutral-600 mt-2 hidden sm:block">
          AI-powered business site selection and economic impact analysis
        </p>
      </div>
    </header>
  );
};

export default Header;
