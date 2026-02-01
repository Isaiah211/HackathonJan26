import React from 'react';
import { Save, Download, FolderOpen } from 'lucide-react';
import { LogoWithText } from '../ui/Logo';
import Button from '../ui/Button';

/**
 * Header Component
 * Professional header with ImpactLens branding
 */
const Header = ({ onSave, onLoad, onExport, hasScenarios }) => {
  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <LogoWithText size={36} />
          <div className="hidden md:block">
            <p className="text-xs text-neutral-500">
              Professional Business Impact Analysis
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoad}
            leftIcon={<FolderOpen className="w-4 h-4" />}
            aria-label="Load saved scenario"
          >
            <span className="hidden sm:inline">Load</span>
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={onSave}
            disabled={!hasScenarios}
            leftIcon={<Save className="w-4 h-4" />}
            aria-label="Save current scenario"
          >
            <span className="hidden sm:inline">Save</span>
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            onClick={onExport}
            disabled={!hasScenarios}
            leftIcon={<Download className="w-4 h-4" />}
            aria-label="Export to PDF"
          >
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
