import React from 'react';

interface PegmanIconProps {
  className?: string;
}

const PegmanIcon: React.FC<PegmanIconProps> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 32 52" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      fill="none" 
      stroke="#f59e0b" // amber-500
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))'}}
    >
      <circle cx="16" cy="8" r="7" fill="#fcd34d" />
      <path 
        d="M26,24 C26,17 22,15 16,15 C10,15 6,17 6,24 L6,34 L12,51 L20,51 L26,34 Z" 
        fill="#fcd34d" // amber-300
      />
    </svg>
  );
};

export default PegmanIcon;
