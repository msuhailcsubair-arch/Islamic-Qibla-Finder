import React from 'react';

interface CompassProps {
  direction: number;
  heading: number | null;
}

const KaabaIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute top-4 left-1/2 -translate-x-1/2"
  >
    <path
      d="M4 4H20V20H4V4Z"
      stroke="#facc15"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M8 8H16V16H8V8Z"
      fill="#facc15"
    />
  </svg>
);


const Compass: React.FC<CompassProps> = ({ direction, heading }) => {
  const isLive = heading !== null;
  // Rotate the compass rose opposite to the device's heading to keep North facing up.
  const roseRotation = -(heading ?? 0);

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 transition-all duration-500">
      <div 
        className="w-full h-full rounded-full bg-white dark:bg-slate-900 border-4 border-gray-200 dark:border-slate-800 shadow-2xl flex items-center justify-center text-gray-700 dark:text-slate-300 font-bold transition-transform duration-200 ease-linear"
        style={{ transform: `rotate(${roseRotation}deg)` }}
      >
        <span className="absolute top-3 text-lg md:text-xl">N</span>
        <span className="absolute bottom-3 text-lg md:text-xl">S</span>
        <span className="absolute left-3 text-lg md:text-xl">W</span>
        <span className="absolute right-3 text-lg md:text-xl">E</span>
        
        {/* Degree markers */}
        {[0, 30, 60, 120, 150, 210, 240, 300, 330].map((deg) => (
             <div key={deg} className="absolute w-full h-full" style={{transform: `rotate(${deg}deg)`}}>
                <div className="absolute top-1 w-px h-2 bg-gray-400 dark:bg-slate-600 left-1/2 -translate-x-1/2"></div>
            </div>
        ))}
         {[45, 135, 225, 315].map((deg) => (
             <div key={deg} className="absolute w-full h-full" style={{transform: `rotate(${deg}deg)`}}>
                <div className="absolute top-1 w-px h-3 bg-gray-500 dark:bg-slate-500 left-1/2 -translate-x-1/2"></div>
            </div>
        ))}

        <div
          className="absolute w-full h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `rotate(${direction}deg)` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 
            border-l-[12px] border-l-transparent
            border-r-[12px] border-r-transparent
            border-b-[90px] border-b-green-700 dark:border-b-green-500
            "
            style={{top: '12px'}}
          ></div>
           <KaabaIcon />
        </div>
        
        <div className={`w-4 h-4 bg-green-700 dark:bg-green-500 rounded-full border-2 border-white dark:border-slate-900 z-10 ${isLive ? 'animate-pulse' : ''}`}></div>
      </div>
    </div>
  );
};

export default Compass;