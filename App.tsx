
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
import ErrorDisplay from './components/ErrorDisplay';
import LocationInfo from './components/LocationInfo';
import type { Coordinates, Theme, AccuracyMode, GeolocationError } from './types';
import { calculateQiblaDirection } from './utils';

// --- Main App Component ---

const App: React.FC = () => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [compassAccuracy, setCompassAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'compass' | 'map'>('compass');
  const [theme, setTheme] = useState<Theme>('auto');
  const [accuracyMode, setAccuracyMode] = useState<AccuracyMode>('high');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);


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
      const accuracy = (event as any).webkitCompassAccuracy;
      
      if (heading !== null) {
        setDeviceHeading(heading);
      }
      if (accuracy !== undefined) {
        setCompassAccuracy(accuracy);
        // Logic to detect when compass accuracy is low
        if (accuracy < 0 || accuracy > 30) {
            setShowCalibration(true);
        } else {
            setShowCalibration(false);
        }
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
        const prompt = `Based on the latitude ${coords.latitude} and longitude ${coords.longitude}, provide the address including the city, state/region, country, and postal code (pincode/zip code) if available. Format the response as a single, human-readable line. Example: 'Mountain View, California, United States, 94043'. Do not add any introductory text or labels.`;

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
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
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
                           location={userLocation}
                           onRecalculate={handleAutoDetectLocation}
                           variant="mapOverlay"
                       />
                    </div>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center gap-8 p-4">
                <Compass direction={qiblaDirection} heading={deviceHeading} accuracy={compassAccuracy} showCalibration={showCalibration} />
                <LocationInfo 
                    direction={qiblaDirection} 
                    address={userAddress} 
                    location={userLocation}
                    onRecalculate={handleAutoDetectLocation} 
                />
            </div>
        );
    }
    return <Spinner />;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      
      <main className="flex-grow flex flex-col items-center justify-center overflow-hidden">
          {renderContent()}
      </main>

      {!isLoading && !error && (
         <footer className={`flex-shrink-0 w-full p-2 flex justify-end pr-5 z-20 ${viewMode === 'map' ? 'absolute bottom-0 bg-transparent' : 'relative'}`}>
             <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm p-1 rounded-full flex shadow-lg">
                 <button 
                     onClick={() => setViewMode('compass')}
                     className={`p-3 rounded-full transition-all transform hover:scale-110 ${viewMode === 'compass' ? 'bg-green-700 text-white' : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-800'}`}
                     aria-label="Switch to Compass View"
                 >
                     <CompassIcon />
                 </button>
                 <button 
                     onClick={() => setViewMode('map')}
                     className={`p-3 rounded-full transition-all transform hover:scale-110 ${viewMode === 'map' ? 'bg-green-700 text-white' : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-800'}`}
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
