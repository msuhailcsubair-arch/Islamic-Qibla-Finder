import React, { useEffect, useRef, useState } from 'react';

interface CompassProps {
  direction: number;
  heading: number | null;
  accuracy: number | null;
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


const Compass: React.FC<CompassProps> = ({ direction, heading, accuracy }) => {
  const roseRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const animatedRoseRot = useRef(0);
  const animatedPointerRot = useRef(0);
  // FIX: Initialize useRef with null and update the type to allow null.
  const animationFrameId = useRef<number | null>(null);
  
  const [showCalibration, setShowCalibration] = useState(false);

  useEffect(() => {
    // A webkitCompassAccuracy value of -1 means calibration is needed.
    // A higher value (e.g., > 30 degrees) means low accuracy.
    if (accuracy !== null && (accuracy < 0 || accuracy > 30)) {
        setShowCalibration(true);
    } else {
        setShowCalibration(false);
    }
  }, [accuracy]);
  
  useEffect(() => {
    const currentHeading = heading ?? 0;
    const targetRoseRot = -currentHeading;
    // The pointer is a child of the rotating rose. To make it point to the absolute
    // Qibla direction, we must counteract the rose's rotation (-heading) by adding
    // the heading back, then apply the qibla direction.
    // Final pointer rotation = direction + heading.
    const targetPointerRot = direction + currentHeading;

    // Linear interpolation function that handles angle wrapping for shortest path
    const lerp = (start: number, end: number, amt: number) => {
      let diff = end - start;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      return start + diff * amt;
    };

    const animate = () => {
        // Stop animating if the change is negligible
        if (
            Math.abs(animatedRoseRot.current - targetRoseRot) < 0.01 &&
            Math.abs(animatedPointerRot.current - targetPointerRot) < 0.01
        ) {
            animatedRoseRot.current = targetRoseRot;
            animatedPointerRot.current = targetPointerRot;
        } else {
             animatedRoseRot.current = lerp(animatedRoseRot.current, targetRoseRot, 0.1);
             animatedPointerRot.current = lerp(animatedPointerRot.current, targetPointerRot, 0.1);
        }

        if (roseRef.current) {
            roseRef.current.style.transform = `rotate(${animatedRoseRot.current}deg)`;
        }
        if (pointerRef.current) {
            // This rotation is relative to the parent (the rose), which is also rotating.
            pointerRef.current.style.transform = `rotate(${animatedPointerRot.current}deg)`;
        }

        animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    };
  }, [direction, heading]);

  const isLive = heading !== null;

  return (
    <div className="flex flex-col items-center gap-4">
        <div className="relative w-64 h-64 md:w-80 md:h-80 transition-all duration-500">
        
        {/* Static North arrow indicator */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10" aria-hidden="true">
            <div className="w-0 h-0 
                border-l-[8px] border-l-transparent
                border-r-[8px] border-r-transparent
                border-b-[12px] border-b-red-600">
            </div>
        </div>

        <div 
            ref={roseRef}
            className="w-full h-full rounded-full bg-white dark:bg-zinc-900 border-4 border-gray-200 dark:border-zinc-800 shadow-2xl flex items-center justify-center text-gray-700 dark:text-zinc-300 font-bold"
        >
            <span className="absolute top-3 text-lg md:text-xl">N</span>
            <span className="absolute bottom-3 text-lg md:text-xl">S</span>
            <span className="absolute left-3 text-lg md:text-xl">W</span>
            <span className="absolute right-3 text-lg md:text-xl">E</span>
            
            {/* Degree markers */}
            {[0, 30, 60, 120, 150, 210, 240, 300, 330].map((deg) => (
                <div key={deg} className="absolute w-full h-full" style={{transform: `rotate(${deg}deg)`}}>
                    <div className="absolute top-1 w-px h-2 bg-gray-400 dark:bg-zinc-600 left-1/2 -translate-x-1/2"></div>
                </div>
            ))}
            {[45, 135, 225, 315].map((deg) => (
                <div key={deg} className="absolute w-full h-full" style={{transform: `rotate(${deg}deg)`}}>
                    <div className="absolute top-1 w-px h-3 bg-gray-500 dark:bg-zinc-500 left-1/2 -translate-x-1/2"></div>
                </div>
            ))}

            <div
            ref={pointerRef}
            className="absolute w-full h-full"
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
            
            <div className={`w-4 h-4 bg-green-700 dark:bg-green-500 rounded-full border-2 border-white dark:border-zinc-900 z-10 ${isLive ? 'animate-pulse' : ''}`}></div>
        </div>
        
        {/* Prominent Calibration Overlay */}
        {showCalibration && (
            <div className="absolute inset-0 z-20 bg-red-900/50 dark:bg-red-950/70 backdrop-blur-sm rounded-full flex flex-col items-center justify-center text-center p-4 animate-pulse">
                {/* Figure 8 Icon SVG */}
                <svg
                    className="w-12 h-12 text-white/80 mb-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M18.15 15.8C19.95 14.53 21 12.86 21 11c0-2.21-1.79-4-4-4s-4 1.79-4 4c0 1.48.81 2.75 2 3.45" />
                    <path d="M5.85 8.2C4.05 9.47 3 11.14 3 13c0 2.21 1.79 4 4 4s4-1.79 4-4c0-1.48-.81-2.75-2-3.45" />
                    <path d="M14 11h-4" />
                </svg>
                <h3 className="font-bold text-lg text-white">Calibration Required</h3>
                <p className="text-white/90 text-sm max-w-xs">
                    Wave device in a figure-8 pattern.
                </p>
            </div>
        )}
        </div>
    </div>
  );
};

export default Compass;