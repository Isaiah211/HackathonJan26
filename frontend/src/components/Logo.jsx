import React from 'react';

/**
 * ImpactIQ Logo Component
 * Professional SVG logo with text mark
 */
export const Logo = ({ size = 'default', className = '', showText = true }) => {
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    default: { icon: 32, text: 'text-xl' },
    lg: { icon: 40, text: 'text-2xl' },
    xl: { icon: 48, text: 'text-3xl' },
  };

  const { icon, text } = sizes[size] || sizes.default;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo icon - geometric abstract representation of data/impact */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-label="ImpactIQ Logo"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
        
        {/* Outer hexagon - representing geographic area */}
        <path
          d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
          stroke="url(#logo-gradient)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Inner ascending bars - representing growth/impact */}
        <rect x="14" y="28" width="4" height="8" rx="1" fill="url(#logo-gradient)" />
        <rect x="20" y="24" width="4" height="12" rx="1" fill="url(#logo-gradient)" />
        <rect x="26" y="20" width="4" height="16" rx="1" fill="url(#logo-gradient)" />
        <rect x="32" y="16" width="4" height="20" rx="1" fill="url(#logo-gradient)" />
        
        {/* Location pin dot */}
        <circle cx="24" cy="12" r="2.5" fill="#ef4444" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-display font-bold ${text} text-neutral-900 tracking-tight`}>
            ImpactIQ
          </span>
          <span className="text-xs text-neutral-500 font-medium tracking-wide">
            Site Intelligence
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
