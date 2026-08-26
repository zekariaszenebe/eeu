import React from 'react';

interface EEULogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  textColor?: string;
  textPosition?: 'right' | 'bottom';
  textSize?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export default function EEULogo({
  className = '',
  size = 44,
  showText = false,
  textColor = 'text-gray-900 dark:text-white',
  textPosition = 'right',
  textSize = 'md',
  style
}: EEULogoProps) {
  // Brand Colors: 
  // Orange: #F48B20 / #f39c12
  // Green: #5FA354 / #22c55e

  const emblem = (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 select-none rounded-full ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="circle-clip">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>

      {/* Outer Border (subtle background container) */}
      <circle cx="50" cy="50" r="48" fill="transparent" />
      
      {/* Mask to ensure everything stays perfectly circular */}
      <g clipPath="url(#circle-clip)">
        
        {/* Sky Background (Orange) */}
        <rect x="0" y="0" width="100" height="100" fill="#F48B20" />
        
        {/* Green Field (slanted, starting around y=31 on left up to y=15 on right) */}
        <path d="M-5 105 L105 105 L105 16 L-5 31 Z" fill="#5FA354" />
        
        {/* Center Utility Pole (White, rounded tip in orange sky) */}
        <rect x="47.5" y="15" width="5" height="85" rx="2.5" fill="#FFFFFF" />
        
        {/* 3 Slanted Metallic Distribution Lines (White) */}
        {/* Line 1 (Top Cable) */}
        <line x1="-5" y1="31" x2="105" y2="17" stroke="#FFFFFF" strokeWidth="2" />
        
        {/* Line 2 (Middle Cable) */}
        <line x1="-5" y1="48" x2="105" y2="34" stroke="#FFFFFF" strokeWidth="2" />
        
        {/* Line 3 (Bottom Cable) */}
        <line x1="-5" y1="65" x2="105" y2="51" stroke="#FFFFFF" strokeWidth="2" />

        {/* --- Insulator Assembly 1 (Top Line, Right of Pole) --- */}
        {/* Bracket connection from pole to insulator base */}
        <path d="M52.5 28.5 L58 28.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        {/* Insulator pointing UPWARD on the top line */}
        <g transform="translate(58, 25.5)">
          {/* Ribbed insulator cups */}
          <path d="M-3 h6 v-1.5 h-6 z" fill="#FFFFFF" />
          <path d="M-4.5 -3.5 h9 v-1.5 h-9 z" fill="#FFFFFF" />
          <path d="M-3.5 -5.5 h7 v-1.5 h-7 z" fill="#FFFFFF" />
          <path d="M-1.5 -7 h3 v-1 h-3 z" fill="#FFFFFF" />
        </g>

        {/* --- Insulator Assembly 2 (Middle Line, Left of Pole) --- */}
        {/* Curved hook connection from pole to insulator top */}
        <path d="M47.5 44 C42 44, 42 45, 42 47" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Insulator hanging DOWNWARD on middle line */}
        <g transform="translate(42, 47)">
          {/* Ribbed core */}
          <path d="M-3 0 h6 v1.5 h-6 z" fill="#FFFFFF" />
          <path d="M-4.5 2 h9 v1.5 h-9 z" fill="#FFFFFF" />
          <path d="M-3.5 4 h7 v1.5 h-7 z" fill="#FFFFFF" />
          <path d="M-1.5 6.2 h3 v1 h-3 z" fill="#FFFFFF" />
        </g>

        {/* --- Insulator Assembly 3 (Bottom Line, Right of Pole) --- */}
        {/* Curved connection from pole to insulator top */}
        <path d="M52.5 61 C58 61, 58 62, 58 64" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Insulator hanging DOWNWARD on bottom line */}
        <g transform="translate(58, 64)">
          {/* Ribbed core */}
          <path d="M-3 0 h6 v1.5 h-6 z" fill="#FFFFFF" />
          <path d="M-4.5 2 h9 v1.5 h-9 z" fill="#FFFFFF" />
          <path d="M-3.5 4 h7 v1.5 h-7 z" fill="#FFFFFF" />
          <path d="M-1.5 6.2 h3 v1 h-3 z" fill="#FFFFFF" />
        </g>
      </g>
    </svg>
  );

  if (!showText) {
    return emblem;
  }

  if (textPosition === 'right') {
    return (
      <div 
        className={`flex items-center gap-3 select-none text-left leading-tight ${className}`}
        style={{ width: '200px', height: '74.75px', ...style }}
      >
        {emblem}
        <div>
          <div className="font-display font-medium text-[#F48B20] text-sm tracking-wide">
            የኢትዮጵያ ኤሌክትሪክ አገልግሎት
          </div>
          <div className="font-display font-bold text-[#5FA354] text-[11px] tracking-normal">
            Ethiopian Electric Utility
          </div>
        </div>
      </div>
    );
  }

  // Bottom alignment
  return (
    <div className="flex flex-col items-center text-center gap-2 select-none">
      {emblem}
      <div className="leading-tight">
        <div className={`font-display font-semibold text-[#F48B20] tracking-wide ${
          textSize === 'sm' ? 'text-xs' : textSize === 'md' ? 'text-sm' : 'text-base'
        }`}>
          የኢትዮጵያ ኤሌክትሪክ አገልግሎት
        </div>
        <div className={`font-display font-black text-[#5FA354] tracking-normal mt-0.5 ${
          textSize === 'sm' ? 'text-[9px]' : textSize === 'md' ? 'text-[11px]' : 'text-xs'
        }`}>
          Ethiopian Electric Utility
        </div>
      </div>
    </div>
  );
}
