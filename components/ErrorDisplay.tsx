
import React from 'react';
import type { GeolocationError } from '../types';

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
        className="mt-6 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
      >
        Try Again
      </button>
    </div>
  );
};

export default ErrorDisplay;
