import React, { useState, Fragment } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { Coordinates } from '../types';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLocationSet: (coords: Coordinates) => void;
}

const ModalSpinner: React.FC = () => (
    <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-slate-400">
        <div className="w-5 h-5 border-2 border-t-2 border-gray-300 dark:border-slate-700 border-t-green-600 dark:border-t-green-500 rounded-full animate-spin"></div>
        <span>Searching...</span>
    </div>
);

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onLocationSet }) => {
    const [locationInput, setLocationInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getCoordinatesFromAddress = async (address: string): Promise<Coordinates | null> => {
        if (!address.trim()) return null;
        
        setIsLoading(true);
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Provide the latitude and longitude for the following location: "${address}". Respond only with a JSON object containing "latitude" and "longitude" keys, like {"latitude": 48.8584, "longitude": 2.2945}. If the location is not found, respond with an empty JSON object {}.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            latitude: { type: Type.NUMBER },
                            longitude: { type: Type.NUMBER },
                        },
                    },
                },
            });

            const resultStr = response.text.trim();
            if (!resultStr || resultStr === '{}') {
                throw new Error("Location not found.");
            }
            const result = JSON.parse(resultStr);

            if (result.latitude && result.longitude) {
                return { latitude: result.latitude, longitude: result.longitude };
            }
            throw new Error("Location not found.");
        } catch (apiError) {
            console.error("Failed to fetch coordinates:", apiError);
            setError("Could not find this location. Please be more specific or check your connection.");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const coords = await getCoordinatesFromAddress(locationInput);
        if (coords) {
            onLocationSet(coords);
            setLocationInput('');
        }
    };

    return (
        <Fragment>
            <div
                className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            <div
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="location-modal-title"
            >
                <div className={`bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
                    <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
                        <h2 id="location-modal-title" className="text-xl font-bold text-gray-800 dark:text-slate-200">Set Location Manually</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label htmlFor="location-input" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                Enter a city, address, or landmark
                            </label>
                            <input
                                id="location-input"
                                type="text"
                                value={locationInput}
                                onChange={(e) => setLocationInput(e.target.value)}
                                placeholder="e.g., Tokyo, Japan"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200"
                                required
                            />
                        </div>
                        
                        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

                        <div className="flex justify-end items-center gap-4 pt-2">
                            {isLoading && <ModalSpinner />}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-green-700 text-white font-bold rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:bg-green-900 disabled:cursor-not-allowed transition-colors"
                            >
                                Find Qibla
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Fragment>
    );
};

export default LocationModal;