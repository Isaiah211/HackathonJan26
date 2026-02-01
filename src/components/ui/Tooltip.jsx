import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Help Tooltip Component
 */
export const HelpTooltip = ({ content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-full"
        aria-label="Help information"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      
      {isVisible && (
        <div 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 animate-fade-in"
          role="tooltip"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-neutral-900 transform rotate-45" />
        </div>
      )}
    </div>
  );
};

/**
 * Generic Tooltip Component
 */
export const Tooltip = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      {isVisible && content && (
        <div 
          className={`absolute ${positionClasses[position]} px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 animate-fade-in pointer-events-none`}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
