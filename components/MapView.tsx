import React, { useState, useEffect, useRef } from 'react';
import type { Coordinates } from '../types';
import { calculateQiblaDirection } from '../utils';
import PegmanIcon from './PegmanIcon';

// Fix: Declare google on the window object to inform TypeScript that it will be available at runtime.
declare global {
  interface Window {
    google: any;
  }
}

interface MapViewProps {
  userLocation: Coordinates;
  onLocationSet: (coords: Coordinates) => void;
  onOpenStreetView: () => void;
}

// Helper to load the Google Maps script
const loadGoogleMapsScript = (onSuccess: () => void, onError: (message: string) => void) => {
  const existingScript = document.getElementById('googleMapsScript');
  if (window.google && window.google.maps) {
    onSuccess();
    return;
  }

  if (!existingScript) {
    const script = document.createElement('script');
    // Note: The Google Maps API key is different from the Gemini API key.
    // Using process.env.API_KEY as per project instructions.
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.API_KEY}`;
    script.id = 'googleMapsScript';
    document.body.appendChild(script);
    script.onload = () => {
      if (window.google && window.google.maps) {
        onSuccess();
      } else {
        onError("Google Maps loaded, but the 'maps' object is not available.");
      }
    };
    script.onerror = () => {
      onError("Google Maps script could not be loaded. Please check your network connection and ad-blockers.");
    }
  } else {
      const loadHandler = () => {
        if(window.google && window.google.maps) {
            onSuccess();
        } else {
            onError("Found existing script, but failed to initialize Google Maps object.");
        }
        existingScript.removeEventListener('load', loadHandler);
      };
      existingScript.addEventListener('load', loadHandler);
  }
};


const MapView: React.FC<MapViewProps> = ({ userLocation, onLocationSet, onOpenStreetView }) => {
  const [mapCenter, setMapCenter] = useState<Coordinates>(userLocation);
  const [zoom, setZoom] = useState(15);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  // Fix: Use 'any' for the map instance since Google Maps types are not installed. This resolves the 'Cannot find namespace google' error.
  const mapInstanceRef = useRef<any | null>(null);

  useEffect(() => {
    loadGoogleMapsScript(
      () => {
        setIsApiLoaded(true);
        setMapError(null);
      },
      (errorMessage) => {
        console.error(errorMessage);
        setMapError(errorMessage);
      }
    );
  }, []);
  
  useEffect(() => {
    if (isApiLoaded && mapContainerRef.current && !mapInstanceRef.current) {
        const map = new window.google.maps.Map(mapContainerRef.current, {
            center: { lat: mapCenter.latitude, lng: mapCenter.longitude },
            zoom: zoom,
            mapTypeId: 'satellite',
            disableDefaultUI: true,
            gestureHandling: 'greedy',
            tilt: 0,
        });
        mapInstanceRef.current = map;

        map.addListener('zoom_changed', () => {
            const newZoom = map.getZoom();
            if (newZoom) {
                setZoom(newZoom);
            }
        });

        map.addListener('dragend', () => {
            const newCenter = map.getCenter();
            if (newCenter) {
                const coords = newCenter.toJSON();
                setMapCenter({ latitude: coords.lat, longitude: coords.lng });
            }
        });
    }
    // This effect should run only once to initialize the map.
    // We disable the lint rule because mapCenter and zoom are only used
    // for the initial setup and we don't want to re-run this effect
    // when they change. Listeners handle state updates after initialization.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiLoaded]);


  useEffect(() => {
    setQiblaDirection(calculateQiblaDirection(mapCenter));
  }, [mapCenter]);

  const handleSetLocation = () => {
    if (mapInstanceRef.current) {
        const center = mapInstanceRef.current.getCenter();
        if (center) {
            const coords = center.toJSON();
            onLocationSet({ latitude: coords.lat, longitude: coords.lng });
        }
    }
  };
  
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
        const currentZoom = mapInstanceRef.current.getZoom() || zoom;
        mapInstanceRef.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
        const currentZoom = mapInstanceRef.current.getZoom() || zoom;
        mapInstanceRef.current.setZoom(currentZoom - 1);
    }
  };

  const renderContent = () => {
    if (mapError) {
      return (
        <div className="text-center p-6 bg-red-500/10 dark:bg-red-900/20 border border-red-500/30 rounded-lg max-w-sm">
          <h3 className="font-bold text-red-600 dark:text-red-400">Map Unavailable</h3>
          <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">{mapError}</p>
        </div>
      );
    }

    if (!isApiLoaded) {
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-t-2 border-gray-300 dark:border-slate-700 border-t-green-600 dark:border-t-green-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-slate-400">Loading Map...</p>
        </div>
      );
    }

    return (
      <>
        <div ref={mapContainerRef} className="w-full h-full" />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20" aria-hidden="true">
            <div className="w-8 h-px bg-white/80 backdrop-blur-sm"></div>
            <div className="w-px h-8 bg-white/80 backdrop-blur-sm absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="w-2 h-2 rounded-full border-2 border-white/80 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div
            className="absolute w-full h-full pointer-events-none z-20"
            style={{ transform: `rotate(${qiblaDirection}deg)` }}
        >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-0 h-0 
                border-l-[10px] border-l-transparent
                border-r-[10px] border-r-transparent
                border-b-[60px] border-b-yellow-400/90"
                style={{transform: 'translateY(-100%)', filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))'}}
            ></div>
        </div>

        <div className="absolute bottom-5 right-5 flex flex-col gap-2 z-30">
             <button
                onClick={onOpenStreetView}
                className="w-12 h-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-full p-2 text-gray-800 dark:text-slate-200 shadow-lg hover:bg-white dark:hover:bg-slate-800 transition" aria-label="Open Street View"
            >
                <PegmanIcon className="w-full h-full" />
            </button>
            <button
                onClick={handleZoomIn} 
                className="w-12 h-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-full text-2xl font-bold text-gray-800 dark:text-slate-200 shadow-lg hover:bg-white dark:hover:bg-slate-800 transition" aria-label="Zoom in"
            >
              +
            </button>
            <button 
                onClick={handleZoomOut}
                className="w-12 h-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-full text-2xl font-bold text-gray-800 dark:text-slate-200 shadow-lg hover:bg-white dark:hover:bg-slate-800 transition" aria-label="Zoom out"
            >
              -
            </button>
        </div>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
            <button 
                onClick={handleSetLocation}
                className="px-6 py-3 bg-green-700 text-white font-bold rounded-full shadow-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-green-500 transition-transform hover:scale-105"
            >
                Set Location
            </button>
        </div>
      </>
    );
  };

  return (
    <div className="w-full h-full bg-gray-200 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden">
        {renderContent()}
    </div>
  );
};

export default MapView;
