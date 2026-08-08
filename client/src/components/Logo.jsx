import React from 'react';

/**
 * SpendPilot Native Vector Logo Component
 * - 100% Transparent background (Zero rectangular artifacts or black image boxes)
 * - Scalable SVG Emblem + Typography Wordmark
 * - Supports Light & Dark background variants
 */
export function Logo({ className = "h-9", light = false, iconOnly = false, width }) {
  // Color tokens based on background variant
  const textColor = light ? "#FCFCF8" : "#092B20";
  const accentColor = light ? "#2ED47A" : "#19B86A";
  const iconBg = light ? "bg-white/10 border-white/20" : "bg-[#092B20] border-[#092B20]";

  return (
    <div 
      className={`inline-flex items-center gap-2.5 font-display select-none transition-transform hover:scale-[1.02] shrink-0 ${
        light ? 'text-[#FCFCF8]' : 'text-[#092B20]'
      }`}
      style={{ width: width ? `${width}px` : undefined }}
    >
      {/* Vector SVG Emblem */}
      <div className={`relative flex items-center justify-center w-9 h-9 rounded-xl border shadow-sm shrink-0 ${
        light ? 'bg-[#0E2920] border-[#1A4337]' : 'bg-[#092B20] border-[#092B20]'
      }`}>
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          className="w-5 h-5"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Magnifying Glass Ring */}
          <circle 
            cx="14" 
            cy="14" 
            r="8.5" 
            stroke={accentColor} 
            strokeWidth="2.8" 
          />
          {/* Handle */}
          <path 
            d="M20.5 20.5L26.5 26.5" 
            stroke={accentColor} 
            strokeWidth="2.8" 
            strokeLinecap="round" 
          />
          {/* Rupee Symbol inside lens */}
          <path 
            d="M11 10.5H17M11 13.5H16M11.5 10.5V17M13 15L16.5 18.5" 
            stroke={light ? "#FCFCF8" : "#2ED47A"} 
            strokeWidth="1.8" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>

      {/* Brand Typography Wordmark */}
      {!iconOnly && (
        <span className="font-display font-extrabold text-xl tracking-tight text-current leading-none flex items-center">
          Spend<span style={{ color: accentColor }}>Pilot</span>
        </span>
      )}
    </div>
  );
}

export function LogoMark({ className = "w-10 h-10", light = false }) {
  const accentColor = light ? "#2ED47A" : "#19B86A";
  return (
    <div className={`relative flex items-center justify-center rounded-2xl border shadow-sm shrink-0 ${className} ${
      light ? 'bg-[#0E2920] border-[#1A4337]' : 'bg-[#092B20] border-[#092B20]'
    }`}>
      <svg 
        viewBox="0 0 32 32" 
        fill="none" 
        className="w-3/5 h-3/5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="14" cy="14" r="8.5" stroke={accentColor} strokeWidth="2.8" />
        <path d="M20.5 20.5L26.5 26.5" stroke={accentColor} strokeWidth="2.8" strokeLinecap="round" />
        <path d="M11 10.5H17M11 13.5H16M11.5 10.5V17M13 15L16.5 18.5" stroke="#2ED47A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
