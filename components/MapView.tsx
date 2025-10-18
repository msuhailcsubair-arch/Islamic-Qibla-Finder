import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Coordinates } from '../types';
import { calculateQiblaDirection } from '../utils';
import PegmanIcon from './PegmanIcon';

// Fix: Declare google on the window object and add custom callback properties
declare global {
  interface Window {
    google: any;
    initMap: () => void;
    gm_authFailure: () => void;
  }
}

interface MapViewProps {
  userLocation: Coordinates;
  onLocationSet: (coords: Coordinates) => void;
  onOpenStreetView: () => void;
}

const KAABA_COORDS = { lat: 21.4225, lng: 39.8262 };

const MapView: React.FC<MapViewProps> = ({ userLocation, onLocationSet, onOpenStreetView }) => {
  const [mapCenter, setMapCenter] = useState<Coordinates>(userLocation);
  const [zoom, setZoom] = useState(15);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const qiblaLineRef = useRef<any | null>(null);

  // Effect for loading the Google Maps script and handling authentication errors
  useEffect(() => {
    // PRE-FLIGHT CHECK: Ensure API key is present before attempting to load the script.
    if (!process.env.API_KEY) {
      setMapError("Google Maps API key is missing. An API key must be configured in the environment variables to use the map feature.");
      return;
    }

    if (window.google && window.google.maps) {
      setIsApiLoaded(true);
      return;
    }

    const handleApiLoad = () => setIsApiLoaded(true);
    const handleAuthError = () => {
      setMapError("Google Maps API authentication failed. The provided API key may be invalid or misconfigured. Please check your Google Cloud project settings.");
    };

    window.initMap = handleApiLoad;
    window.gm_authFailure = handleAuthError;

    const scriptId = 'googleMapsScript';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.API_KEY}&callback=initMap&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setMapError("The Google Maps script could not be loaded. Please check your network connection and ensure ad-blockers are not interfering.");
      };
      document.body.appendChild(script);
    }
    
    return () => {
      delete (window as any).initMap;
      delete (window as any).gm_authFailure;
    };
  }, []);

  
  useEffect(() => {
    if (isApiLoaded && mapContainerRef.current && !mapInstanceRef.current) {
        const map = new window.google.maps.Map(mapContainerRef.current, {
            center: { lat: mapCenter.latitude, lng: mapCenter.longitude },
            zoom: zoom,
            mapTypeId: 'hybrid',
            disableDefaultUI: true,
            gestureHandling: 'greedy',
            tilt: 0,
        });
        mapInstanceRef.current = map;

        const lineSymbol = {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        };
    
        const qiblaLine = new window.google.maps.Polyline({
          strokeColor: '#facc15',
          strokeOpacity: 0.9,
          strokeWeight: 3,
          geodesic: true,
          map: map,
          icons: [{
              icon: lineSymbol,
              offset: '100%'
          }],
        });
        qiblaLineRef.current = qiblaLine;


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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiLoaded]);


  useEffect(() => {
    setQiblaDirection(calculateQiblaDirection(mapCenter));

    if (qiblaLineRef.current && window.google) {
        const centerCoords = { lat: mapCenter.latitude, lng: mapCenter.longitude };
        qiblaLineRef.current.setPath([centerCoords, KAABA_COORDS]);
    }
  }, [mapCenter]);

  const handleSetLocation = useCallback(() => {
    if (mapInstanceRef.current) {
        const center = mapInstanceRef.current.getCenter();
        if (center) {
            const coords = center.toJSON();
            onLocationSet({ latitude: coords.lat, longitude: coords.lng });
        }
    }
  }, [onLocationSet]);
  
  const handleZoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
        const currentZoom = mapInstanceRef.current.getZoom();
        mapInstanceRef.current.setZoom(currentZoom + 1);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
        const currentZoom = mapInstanceRef.current.getZoom();
        mapInstanceRef.current.setZoom(currentZoom - 1);
    }
  }, []);

  const renderContent = () => {
    if (mapError) {
      return (
        <div className="text-center p-6 bg-red-500/10 dark:bg-red-900/20 border border-red-500/30 rounded-lg max-w-sm">
          <h3 className="font-bold text-red-600 dark:text-red-400">Map Unavailable</h3>
          <p className="mt-2 text-sm text-gray-700 dark:text-zinc-300">{mapError}</p>
        </div>
      );
    }

    if (!isApiLoaded) {
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-t-2 border-gray-300 dark:border-zinc-700 border-t-green-600 dark:border-t-green-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-zinc-400">Loading Map...</p>
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

        <div className="absolute bottom-5 right-5 flex flex-col gap-2 z-30">
             <button
                onClick={onOpenStreetView}
                className="w-12 h-12 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-full p-2 text-gray-800 dark:text-zinc-200 shadow-lg hover:bg-white dark:hover:bg-zinc-800 transition transform hover:scale-110" aria-label="Open Street View"
            >
                <PegmanIcon className="w-full h-full" />
            </button>
            <button
                onClick={handleZoomIn} 
                className="w-12 h-12 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-full text-2xl font-bold text-gray-800 dark:text-zinc-200 shadow-lg hover:bg-white dark:hover:bg-zinc-800 transition transform hover:scale-110" aria-label="Zoom in"
            >
              +
            </button>
            <button 
                onClick={handleZoomOut}
                className="w-12 h-12 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-full text-2xl font-bold text-gray-800 dark:text-zinc-200 shadow-lg hover:bg-white dark:hover:bg-zinc-800 transition transform hover:scale-110" aria-label="Zoom out"
            >
              -
            </button>
        </div>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
            <button 
                onClick={handleSetLocation}
                className="px-6 py-3 bg-green-700 text-white font-bold rounded-full shadow-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-green-500 transition-transform hover:scale-105"
            >
                Set Location
            </button>
        </div>
      </>
    );
  };

  return (
    <div className="w-full h-full bg-gray-200 dark:bg-zinc-800 relative flex items-center justify-center overflow-hidden">
        {renderContent()}
    </div>
  );
};

export default MapView;