import React, { useState } from 'react';
import { X, PlayCircle } from 'lucide-react';

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReward: () => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({ isOpen, onClose, onReward }) => {
  const [isWatching, setIsWatching] = useState(false);

  if (!isOpen) return null;

  const handleWatchAd = () => {
    setIsWatching(true);
    // Simulate ad duration
    setTimeout(() => {
      setIsWatching(false);
      onReward();
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-pastel-darkSurface rounded-3xl p-6 w-full max-w-sm shadow-xl relative animate-fade-in">
        {!isWatching && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        )}

        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto text-rose-500">
             <PlayCircle size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            {isWatching ? 'Playing Ad...' : 'Unlock Premium Theme'}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {isWatching 
              ? 'Please wait while the video plays...' 
              : 'Watch a short video to unlock the "Ocean Calm" theme for 24 hours.'}
          </p>

          {!isWatching && (
            <button
              onClick={handleWatchAd}
              className="w-full py-3 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Watch Video
            </button>
          )}
        </div>
      </div>
    </div>
  );
};