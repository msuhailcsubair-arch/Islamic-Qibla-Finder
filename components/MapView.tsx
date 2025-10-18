import React from 'react';

interface MapViewProps {
  qiblaDirection: number;
}

const MapView: React.FC<MapViewProps> = ({ qiblaDirection }) => {
  // We create a simplified, abstract representation of the map.
  // The user is always centered at the bottom, and the Kaaba is positioned
  // according to the Qibla direction.

  // Normalize angle for consistent CSS rotation
  const rotation = qiblaDirection - 90;

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 transition-all duration-500 flex items-center justify-center">
      <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-slate-300 dark:border-slate-700 shadow-2xl flex items-center justify-center p-4">
        <div className="w-full h-full relative border-2 border-dashed border-slate-400 dark:border-slate-600 rounded-full">
          {/* User's Location Pin (Always at the bottom center) */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="text-xs text-teal-600 dark:text-teal-300">You</span>
            <div className="w-4 h-4 bg-teal-500 dark:bg-teal-400 rounded-full border-2 border-white dark:border-slate-900"></div>
          </div>

          {/* Kaaba Location Pin (Rotates around the center) */}
          <div
            className="absolute w-full h-full"
            style={{ transform: `rotate(${qiblaDirection}deg)` }}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
               <div className="w-4 h-4 flex items-center justify-center">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4H20V20H4V4Z" stroke="#facc15" strokeWidth="2.5" strokeLinejoin="round"/>
                    <path d="M8 8H16V16H8V8Z" fill="#facc15"/>
                 </svg>
               </div>
               <span className="text-xs text-yellow-500 dark:text-yellow-300">Kaaba</span>
            </div>
          </div>
          
          {/* Direction Line */}
          <div className="absolute w-full h-full flex justify-center" style={{transform: `rotate(${rotation}deg)`}}>
            <div className="h-full w-px bg-gradient-to-t from-teal-500/50 to-yellow-500/50 dark:from-teal-400/50 dark:to-yellow-300/50"></div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MapView;