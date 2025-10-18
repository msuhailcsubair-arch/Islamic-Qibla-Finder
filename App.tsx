import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import Header from './components/Header';
import Compass from './components/Compass';
import Spinner from './components/Spinner';
import Sidebar from './components/Menu';
import AboutModal from './components/AboutModal';
import MapView from './components/MapView';
import MapIcon from './components/MapIcon';
import CompassIcon from './components/CompassIcon';
import LocationModal from './components/LocationModal';
import StreetView from './components/StreetView';
import type { Coordinates } from './types';
import { calculateQiblaDirection } from './utils';

// --- Types ---
export type Theme = 'auto' | 'light' | 'dark';
export type AccuracyMode = 'high' | 'medium' | 'low';
type GeolocationError = {
    message: string;
    code?: number;
}

// --- Helper Components ---

const ErrorDisplay: React.FC<{ error: GeolocationError; onRetry: () => void }> = ({ error, onRetry }) => {
  const renderGuidance = () => {
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        return (
          <ul className="list-disc list-inside text-left text-sm text-red-700 dark:text-red-300 space-y-1">
            <li>Open your browser's settings and allow this site to access your location.</li>
            <li>Ensure location services are enabled on your device (in your system settings).</li>
          </ul>
        );
      case 2: // POSITION_UNAVAILABLE
        return (
          <ul className="list-disc list-inside text-left text-sm text-red-700 dark:text-red-300 space-y-1">
            <li>Check your internet or data connection.</li>
            <li>If you are indoors, try moving near a window or outdoors for a better signal.</li>
          </ul>
        );
      case 3: // TIMEOUT
        return (
          <ul className="list-disc list-inside text-left text-sm text-red-700 dark:text-red-300 space-y-1">
            <li>Your connection may be slow. Please check your Wi-Fi or mobile data.</li>
          </ul>
        );
      default:
        return null;
    }
  };
    
  return (
    <div className="text-center bg-red-500/10 dark:bg-red-900/20 border border-red-500/30 dark:border-red-500/50 p-6 rounded-lg max-w-sm w-full">
      <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Error</h2>
      <p className="text-red-800 dark:text-red-300 mt-2">{error.message}</p>
      
      {error.code && (
        <div className="mt-4 pt-4 border-t border-red-500/20">
          <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">What you can do:</h3>
          {renderGuidance()}
        </div>
      )}

      <button
        onClick={onRetry}
        className="mt-6 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full transition-all duration-300"
      >
        Try Again
      </button>
    </div>
  );
};


const LocationInfo: React.FC<{ direction: number; address: string; onRecalculate: () => void; variant?: 'default' | 'mapOverlay' }> = ({ direction, address, onRecalculate, variant = 'default' }) => {
  if (variant === 'mapOverlay') {
    return (
      <div className="text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-lg p-3 rounded-lg w-full">
        <h2 className="text-2xl font-bold text-green-700 dark:text-green-500">{direction.toFixed(2)}°</h2>
        <p className="text-xs text-gray-600 dark:text-slate-400">{address}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
        <div className="text-center bg-white dark:bg-slate-900 shadow-sm p-4 rounded-lg w-full max-w-md">
            <h2 className="text-3xl font-bold text-green-700 dark:text-green-500">{direction.toFixed(2)}°</h2>
            <p className="text-gray-500 dark:text-slate-400">From True North</p>
            <div className="text-xs text-gray-500 dark:text-slate-500 mt-3 border-t border-gray-200 dark:border-slate-800 pt-2">
                Your Location: <span className="text-gray-700 dark:text-slate-300">{address}</span>
            </div>
        </div>
        <button
            onClick={onRecalculate}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 font-bold py-2 px-6 rounded-full transition-all duration-300"
        >
            Recalculate
        </button>
    </div>
  );
};


// --- Main App Component ---

const App: React.FC = () => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'compass' | 'map'>('compass');
  const [theme, setTheme] = useState<Theme>('auto');
  const [accuracyMode, setAccuracyMode] = useState<AccuracyMode>('high');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);


  useEffect(() => {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  // Effect to handle device orientation for live compass
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // Use webkitCompassHeading for iOS compatibility
      const heading = (event as any).webkitCompassHeading ?? event.alpha;
      if (heading !== null) {
        setDeviceHeading(heading);
      }
    };
    
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const getAddressFromCoordinates = useCallback(async (coords: Coordinates) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Based on the latitude ${coords.latitude} and longitude ${coords.longitude}, provide a concise address (e.g., City, State/Region, Country). Format the response as a single line. Do not add any extra labels or text.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        const address = response.text.trim();
        if (address) {
           setUserAddress(address);
        } else {
            throw new Error("Received empty address from API.");
        }
    } catch (apiError) {
        console.error("Failed to fetch address from Gemini API:", apiError);
        setUserAddress(`Lat: ${coords.latitude.toFixed(4)}, Lon: ${coords.longitude.toFixed(4)}`);
    }
  }, []);

  const processNewCoordinates = useCallback(async (coords: Coordinates) => {
    setUserLocation(coords);
    setQiblaDirection(calculateQiblaDirection(coords));
    await getAddressFromCoordinates(coords);
  }, [getAddressFromCoordinates]);

  const handleAutoDetectLocation = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setUserLocation(null);
    setUserAddress(null);
    setQiblaDirection(null);

    if (!navigator.geolocation) {
      setError({ message: "Geolocation is not supported by your browser." });
      setIsLoading(false);
      return;
    }
    
    const getGeolocationOptions = (): PositionOptions => {
        switch (accuracyMode) {
            case 'high': return { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
            case 'medium': return { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 };
            case 'low': return { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 };
            default: return { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
        }
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await processNewCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (geoError) => {
        setError({ message: `Error: ${geoError.message}`, code: geoError.code });
        setIsLoading(false);
      },
      getGeolocationOptions()
    );
  }, [processNewCoordinates, accuracyMode]);
  
  useEffect(() => {
    handleAutoDetectLocation();
  }, [handleAutoDetectLocation]);

  const handleNewLocationSet = useCallback(async (coords: Coordinates) => {
    if (isLocationModalOpen) setIsLocationModalOpen(false);
    setViewMode('compass');
    setIsLoading(true);
    setError(null);
    setUserAddress(null);
    setQiblaDirection(null);
    
    // Use a promise-based timeout for cleaner async flow and to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await processNewCoordinates(coords);
    setIsLoading(false);
  }, [isLocationModalOpen, processNewCoordinates]);
  
  const renderContent = () => {
    if (isLoading) {
        return <Spinner />;
    }
    if (error) {
        return <ErrorDisplay error={error} onRetry={handleAutoDetectLocation} />;
    }
    if (qiblaDirection !== null && userAddress && userLocation) {
        if (viewMode === 'map') {
            return (
                <div className="flex-grow w-full h-full relative">
                    <MapView 
                        userLocation={userLocation}
                        onLocationSet={handleNewLocationSet}
                        onOpenStreetView={() => setIsStreetViewOpen(true)}
                    />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-10">
                       <LocationInfo
                           direction={qiblaDirection}
                           address={userAddress}
                           onRecalculate={handleAutoDetectLocation}
                           variant="mapOverlay"
                       />
                    </div>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center gap-8 p-4">
                <Compass direction={qiblaDirection} heading={deviceHeading} />
                <LocationInfo direction={qiblaDirection} address={userAddress} onRecalculate={handleAutoDetectLocation} />
            </div>
        );
    }
    return <Spinner />;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      
      <main className="flex-grow flex flex-col items-center justify-center overflow-hidden">
          {renderContent()}
      </main>

      {!isLoading && !error && (
         <footer className={`flex-shrink-0 w-full p-2 flex justify-end pr-5 z-20 ${viewMode === 'map' ? 'absolute bottom-0 bg-transparent' : 'relative'}`}>
             <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm p-1 rounded-full flex shadow-lg">
                 <button 
                     onClick={() => setViewMode('compass')}
                     className={`p-3 rounded-full transition-colors ${viewMode === 'compass' ? 'bg-green-700 text-white' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
                     aria-label="Switch to Compass View"
                 >
                     <CompassIcon />
                 </button>
                 <button 
                     onClick={() => setViewMode('map')}
                     className={`p-3 rounded-full transition-colors ${viewMode === 'map' ? 'bg-green-700 text-white' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
                     aria-label="Switch to Map View"
                 >
                     <MapIcon />
                 </button>
             </div>
         </footer>
      )}

      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onAutoDetect={() => { setIsSidebarOpen(false); handleAutoDetectLocation(); }}
        onManualSet={() => { setIsSidebarOpen(false); setIsLocationModalOpen(true); }}
        onAbout={() => { setIsSidebarOpen(false); setIsAboutModalOpen(true); }}
        currentTheme={theme}
        onChangeTheme={setTheme}
        currentAccuracy={accuracyMode}
        onChangeAccuracy={setAccuracyMode}
      />

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} onLocationSet={handleNewLocationSet} />
      {isStreetViewOpen && userLocation && (
          <StreetView location={userLocation} onClose={() => setIsStreetViewOpen(false)} />
      )}
    </div>
  );
};

export default App;
