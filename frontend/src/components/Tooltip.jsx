import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import clsx from 'clsx';

/**
 * Tooltip Component
 * Provides contextual help information
 */
export const Tooltip = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
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
      
      {isVisible && (
        <div 
          className={clsx(
            'absolute z-50 px-3 py-2 text-sm text-white bg-neutral-900 rounded-lg shadow-lg whitespace-nowrap',
            'animate-fade-in',
            positionClasses[position]
          )}
          role="tooltip"
        >
          {content}
          <div 
            className={clsx(
              'absolute w-2 h-2 bg-neutral-900 rotate-45',
              position === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2',
              position === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2',
              position === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2',
              position === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2'
            )}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Help Icon with Tooltip
 */
export const HelpTooltip = ({ content, position = 'top' }) => {
  return (
    <Tooltip content={content} position={position}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
        aria-label="Help information"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    </Tooltip>
  );
};

export default Tooltip;
