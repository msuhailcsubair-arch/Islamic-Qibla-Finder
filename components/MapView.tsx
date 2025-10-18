import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Coordinates } from '../types';
import { calculateQiblaDirection } from '../utils';

// Fix: Declare google on the window object to inform TypeScript that it will be available at runtime.
declare global {
  interface Window {
    google: any;
  }
}

interface MapViewProps {
  userLocation: Coordinates;
  onLocationSet: (coords: Coordinates) => void;
}

// Helper to load the Google Maps script
const loadGoogleMapsScript = (callback: () => void) => {
  const existingScript = document.getElementById('googleMapsScript');
  if (window.google && window.google.maps) {
    callback();
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
        callback();
      }
    };
    script.onerror = () => {
      console.error("Google Maps script could not be loaded.");
    }
  } else {
      existingScript.addEventListener('load', () => {
        if(window.google && window.google.maps) {
            callback();
        }
      });
  }
};


const MapView: React.FC<MapViewProps> = ({ userLocation, onLocationSet }) => {
  const [mapCenter, setMapCenter] = useState<Coordinates>(userLocation);
  const [zoom, setZoom] = useState(15);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  // Fix: Use 'any' for the map instance since Google Maps types are not installed. This resolves the 'Cannot find namespace google' error.
  const mapInstanceRef = useRef<any | null>(null);

  useEffect(() => {
    loadGoogleMapsScript(() => {
      setIsApiLoaded(true);
    });
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
  }, [isApiLoaded, mapCenter, zoom]);


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

  return (
    <div className="w-full h-full bg-blue-200 dark:bg-slate-900 relative flex items-center justify-center overflow-hidden">
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
    </div>
  );
};

export default MapView;