import React from 'react';

const Compass: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
        <img
            fetchPriority="high"
            decoding="async"
            src="https://myislam.org/wp-content/uploads/2022/03/qiblah-compass.png"
            id="kaabaCompass"
            alt="Qibla Compass"
            className="w-64 h-64 md:w-80 md:h-80 object-contain"
        />
        <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-xs px-2">
            This compass shows the general direction. Use the angle below for the precise Qibla direction from True North.
        </p>
    </div>
  );
};

export default Compass;