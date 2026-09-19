import React from 'react';

export const HexagonalLogo = ({ className = "w-8 h-8", showText = true }: { className?: string, showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hexGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="hexGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <path d="M50 5 L88.97 27.5 V72.5 L50 95 L11.03 72.5 V27.5 Z" fill="url(#hexGrad1)" />
        <path d="M32 30 H44 V42 H56 V30 H68 V70 H56 V54 H44 V70 H32 Z" fill="#0B0F14" />
        <path d="M50 15 L78 31 V69 L50 85 L22 69 V31 Z" fill="url(#hexGrad2)" opacity="0.15" />
      </svg>
      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold tracking-wider text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 font-sans">
            HEXAGONAL
          </span>
          <span className="text-[9px] tracking-[0.25em] text-gray-400 font-semibold -mt-1">
            DEX
          </span>
        </div>
      )}
    </div>
  );
};

