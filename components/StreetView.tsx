import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import type { Coordinates } from '../types';

interface StreetViewProps {
    location: Coordinates;
    onClose: () => void;
}

const StreetView: React.FC<StreetViewProps> = ({ location, onClose }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const viewRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const previousPosition = useRef({ x: 0 });
    const backgroundPositionX = useRef(0);

    const generateStreetViewImage = useCallback(async (coords: Coordinates) => {
        setIsLoading(true);
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Generate a full 360-degree, equirectangular panoramic street view image, similar to Google Street View, for the location at latitude ${coords.latitude}, longitude ${coords.longitude}. The image should be seamless for use in a spherical viewer. Do not include any user interface elements, watermarks, or overlays.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            
            const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (part?.inlineData) {
                setImageUrl(`data:image/jpeg;base64,${part.inlineData.data}`);
            } else {
                throw new Error("No street view image could be generated for this location.");
            }
        } catch (apiError) {
            console.error("Failed to generate street view image:", apiError);
            setError("No street view available, or there was an error loading it.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        generateStreetViewImage(location);
    }, [location, generateStreetViewImage]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        isDragging.current = true;
        previousPosition.current.x = e.clientX;
        if (viewRef.current) viewRef.current.style.cursor = 'grabbing';
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging.current || !viewRef.current) return;
        const deltaX = e.clientX - previousPosition.current.x;
        backgroundPositionX.current -= deltaX * 0.5; // Adjust sensitivity
        viewRef.current.style.backgroundPositionX = `${backgroundPositionX.current}px`;
        previousPosition.current.x = e.clientX;
    }, []);
    
    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        if (viewRef.current) viewRef.current.style.cursor = 'grab';
    }, []);

    return (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            {isLoading && (
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 border-4 border-t-4 border-gray-500 border-t-yellow-400 rounded-full animate-spin"></div>
                    <p className="text-white">Loading Street View...</p>
                </div>
            )}
            {error && !isLoading && (
                <div className="text-center p-4">
                    <p className="text-red-400 text-lg">{error}</p>
                </div>
            )}
            {!isLoading && !error && imageUrl && (
                <div 
                    ref={viewRef}
                    className="w-full h-full bg-cover"
                    style={{ 
                        backgroundImage: `url(${imageUrl})`, 
                        cursor: 'grab' 
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                </div>
            )}

            <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-black/50 text-white p-3 rounded-full hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
                aria-label="Close Street View"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default StreetView;
