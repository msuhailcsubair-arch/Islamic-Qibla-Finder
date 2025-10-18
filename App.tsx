import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import Compass from './components/Compass';
import Spinner from './components/Spinner';
import Sidebar from './components/Menu';
import AboutModal from './components/AboutModal';
import MapView from './components/MapView';
import MapIcon from './components/MapIcon';
import CompassIcon from './components/CompassIcon';
import type { Coordinates } from './types';

// --- Constants ---
const KAABA_COORDS: Coordinates = {
  latitude: 21.4225,
  longitude: 39.8262,
};

// --- Helper Components ---

const ErrorDisplay: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="text-center bg-red-500/10 dark:bg-red-900/20 border border-red-500/30 dark:border-red-500/50 p-6 rounded-lg max-w-sm">
    <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Error</h2>
    <p className="text-slate-700 dark:text-slate-300 mt-2">{message}</p>
    <button
      onClick={onRetry}
      className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full transition-all duration-300"
    >
      Try Again
    </button>
  </div>
);

const LocationInfo: React.FC<{ direction: number; address: string; onRecalculate: () => void }> = ({ direction, address, onRecalculate }) => (
    <div className="flex flex-col items-center gap-4 w-full">
        <div className="text-center bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg w-full max-w-md">
            <h2 className="text-3xl font-bold text-teal-600 dark:text-teal-300">{direction.toFixed(2)}°</h2>
            <p className="text-slate-500 dark:text-slate-400">From True North</p>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-3 border-t border-slate-300 dark:border-slate-700 pt-2">
                Your Location: <span className="text-slate-700 dark:text-slate-400">{address}</span>
            </div>
        </div>
        <button
            onClick={onRecalculate}
            className="bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold py-2 px-6 rounded-full transition-all duration-300"
        >
            Recalculate
        </button>
    </div>
);


// --- Main App Component ---

type Theme = 'auto' | 'light' | 'dark';

const App: React.FC = () => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'compass' | 'map'>('compass');
  const [theme, setTheme] = useState<Theme>('auto');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  useEffect(() => {
    if (theme === 'auto') {
      const hour = new Date().getHours();
      // Day time between 6 AM and 6 PM
      if (hour > 6 && hour < 18) {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const getAddressFromCoordinates = useCallback(async (coords: Coordinates) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Based on the latitude ${coords.latitude} and longitude ${coords.longitude}, provide the city, district, state, and pincode. Format the response as a single, comma-separated line like this: City, District, State, Pincode. Do not add any extra labels or text.`;

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
        // Fallback to coordinates if the API fails
        setUserAddress(`Lat: ${coords.latitude.toFixed(4)}, Lon: ${coords.longitude.toFixed(4)}`);
    }
  }, []);

  const calculateQiblaDirection = (userCoords: Coordinates) => {
    const lat1 = userCoords.latitude * (Math.PI / 180);
    const lon1 = userCoords.longitude * (Math.PI / 180);
    const lat2 = KAABA_COORDS.latitude * (Math.PI / 180);
    const lon2 = KAABA_COORDS.longitude * (Math.PI / 180);

    const lonDiff = lon2 - lon1;

    const y = Math.sin(lonDiff) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lonDiff);

    let bearing = Math.atan2(y, x) * (180 / Math.PI);
    bearing = (bearing + 360) % 360; // Normalize to 0-360

    setQiblaDirection(bearing);
  };

  const handleFindQibla = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setUserLocation(null);
    setUserAddress(null);
    setQiblaDirection(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(coords);
        calculateQiblaDirection(coords);
        await getAddressFromCoordinates(coords);
        setIsLoading(false);
      },
      (geoError) => {
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError("Location access denied. Please enable it in your browser settings to find the Qibla.");
            break;
          case geoError.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case geoError.TIMEOUT:
            setError("The request to get user location timed out.");
            break;
          default:
            setError("An unknown error occurred while getting location.");
            break;
        }
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [getAddressFromCoordinates]);
  
  useEffect(() => {
    handleFindQibla();
  }, [handleFindQibla]);
  
  const renderContent = () => {
    if (isLoading) {
        return <Spinner />;
    }
    if (error) {
        return <ErrorDisplay message={error} onRetry={handleFindQibla} />;
    }
    if (qiblaDirection !== null && userAddress) {
        return (
          <div className="flex flex-col items-center gap-6 md:gap-8">
            {viewMode === 'compass' ? <Compass direction={qiblaDirection} /> : <MapView qiblaDirection={qiblaDirection} />}
            <LocationInfo direction={qiblaDirection} address={userAddress} onRecalculate={handleFindQibla} />
          </div>
        );
    }
    return <Spinner />;
};

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 relative transition-colors duration-500">
        <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-300/70 dark:hover:bg-slate-700/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-teal-500"
            aria-label="Open menu"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-800 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>

        <Sidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onChangeLocation={() => {
                handleFindQibla();
                setIsSidebarOpen(false);
            }}
            currentTheme={theme}
            onChangeTheme={setTheme}
            onAbout={() => {
                setIsAboutModalOpen(true);
                setIsSidebarOpen(false);
            }}
        />
        
        <AboutModal
            isOpen={isAboutModalOpen}
            onClose={() => setIsAboutModalOpen(false)}
        />

        <div className="w-full max-w-lg mx-auto flex items-center justify-center">
            {renderContent()}
        </div>
        
        {qiblaDirection !== null && (
            <button
              onClick={() => setViewMode(prev => prev === 'compass' ? 'map' : 'compass')}
              className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow-lg flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-teal-400"
              aria-label={`Switch to ${viewMode === 'compass' ? 'map' : 'compass'} view`}
            >
              {viewMode === 'compass' ? <MapIcon /> : <CompassIcon />}
            </button>
        )}

        <footer className="absolute bottom-4 text-center text-slate-500 dark:text-slate-600 text-sm max-w-xs md:max-w-none">
            <p>Designed for spiritual guidance. Always verify with a secondary source if possible.</p>
        </footer>
    </main>
  );
};

export default App;