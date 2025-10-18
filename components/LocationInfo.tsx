
import React from 'react';
import type { Coordinates } from '../types';

interface LocationInfoProps {
    direction: number;
    address: string;
    location: Coordinates;
    onRecalculate: () => void;
    variant?: 'default' | 'mapOverlay';
}

const LocationInfo: React.FC<LocationInfoProps> = ({ direction, address, location, onRecalculate, variant = 'default' }) => {
    const renderDetails = () => (
        <div className="text-xs grid grid-cols-2 gap-x-4 gap-y-1 mt-3 border-t border-gray-200 dark:border-zinc-800 pt-2">
            <span className="text-gray-500 dark:text-zinc-500 text-left">Location:</span>
            <span className="text-gray-700 dark:text-zinc-300 text-right col-span-1">{address}</span>

            {typeof location.accuracy !== 'undefined' && (
                <>
                    <span className="text-gray-500 dark:text-zinc-500 text-left">Accuracy:</span>
                    <span className="text-gray-700 dark:text-zinc-300 text-right">±{location.accuracy.toFixed(0)} meters</span>
                </>
            )}
            {typeof location.altitude !== 'undefined' && (
                 <>
                    <span className="text-gray-500 dark:text-zinc-500 text-left">Altitude:</span>
                    <span className="text-gray-700 dark:text-zinc-300 text-right">{location.altitude.toFixed(0)} meters</span>
                </>
            )}
        </div>
    );


    if (variant === 'mapOverlay') {
        return (
            <div className="text-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-lg p-3 rounded-lg w-full">
                <h2 className="text-2xl font-bold text-green-700 dark:text-green-500">{direction.toFixed(2)}°</h2>
                <p className="text-xs text-gray-600 dark:text-zinc-400">{address}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <div className="text-center bg-white dark:bg-zinc-900 shadow-sm p-4 rounded-lg w-full max-w-md">
                <h2 className="text-3xl font-bold text-green-700 dark:text-green-500">{direction.toFixed(2)}°</h2>
                <p className="text-gray-500 dark:text-zinc-400">From True North</p>
                {renderDetails()}
            </div>
            <button
                onClick={onRecalculate}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-bold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
            >
                Recalculate
            </button>
        </div>
    );
};

export default LocationInfo;
