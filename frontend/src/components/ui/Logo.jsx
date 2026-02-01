import React from 'react';

/**
 * ImpactLens Logo Component
 * A magnifying lens with a bar chart/graph inside
 */
const Logo = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ImpactLens Logo"
      role="img"
    >
      {/* Lens outer circle */}
      <circle
        cx="20"
        cy="20"
        r="14"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        className="text-brand-600"
      />
      
      {/* Lens inner reflection */}
      <circle
        cx="16"
        cy="16"
        r="3"
        fill="currentColor"
        opacity="0.2"
        className="text-brand-400"
      />
      
      {/* Lens handle */}
      <path
        d="M 30 30 L 42 42"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-brand-600"
      />
      
      {/* Bar chart inside lens - 3 bars of different heights */}
      <g className="text-success-600">
        {/* Bar 1 - shortest */}
        <rect
          x="14"
          y="22"
          width="3"
          height="6"
          rx="0.5"
          fill="currentColor"
        />
        
        {/* Bar 2 - medium */}
        <rect
          x="18"
          y="18"
          width="3"
          height="10"
          rx="0.5"
          fill="currentColor"
        />
        
        {/* Bar 3 - tallest */}
        <rect
          x="22"
          y="14"
          width="3"
          height="14"
          rx="0.5"
          fill="currentColor"
        />
      </g>
      
      {/* Trend line overlay */}
      <path
        d="M 15 26 L 19 20 L 24 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="text-brand-500"
        opacity="0.6"
      />
      
      {/* Small data points on trend line */}
      <circle cx="15" cy="26" r="1.2" fill="currentColor" className="text-brand-500" />
      <circle cx="19" cy="20" r="1.2" fill="currentColor" className="text-brand-500" />
      <circle cx="24" cy="16" r="1.2" fill="currentColor" className="text-brand-500" />
    </svg>
  );
};

/**
 * Logo with text component
 */
export const LogoWithText = ({ className = '', size = 32, showText = true }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo size={size} />
      {showText && (
        <span className="text-xl font-bold text-neutral-900">
          Impact<span className="text-brand-600">Lens</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
