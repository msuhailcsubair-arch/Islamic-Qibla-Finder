import React from 'react';

const MAP_IMAGE_URL = 'https://i.imgur.com/8a5ZJ2k.png';

const MapView: React.FC = () => {
  return (
    <div className="w-full h-full bg-gray-200 dark:bg-zinc-800 relative flex items-center justify-center overflow-hidden">
        <img 
            src={MAP_IMAGE_URL}
            alt="World map showing Qibla directions"
            className="w-full h-full object-cover"
        />
    </div>
  );
};

export default MapView;
