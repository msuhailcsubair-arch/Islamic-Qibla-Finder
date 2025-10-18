import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 border-4 border-t-4 border-slate-300 dark:border-slate-700 border-t-teal-500 dark:border-t-teal-400 rounded-full animate-spin"></div>
      <p className="text-slate-600 dark:text-slate-400">Getting your location...</p>
    </div>
  );
};

export default Spinner;