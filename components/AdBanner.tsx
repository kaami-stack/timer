import React from 'react';
import { X } from 'lucide-react';

interface AdBannerProps {
  isPremium: boolean;
  personalizedAds: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({ isPremium, personalizedAds }) => {
  if (isPremium) return null;

  // In a real native implementation, personalizedAds=false would trigger:
  // request.addNetworkExtrasBundle(AdMobAdapter.class, new Bundle().putString("npa", "1"));

  return (
    <div className="fixed bottom-0 left-0 w-full h-16 bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 flex items-center justify-center z-50">
      <div className="text-xs text-gray-500 absolute top-1 right-2 flex items-center gap-1">
        <span>Ad</span>
        <X size={10} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Google AdMob Banner Placeholder
        </p>
        {!personalizedAds && (
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">
            (Non-Personalized)
          </p>
        )}
      </div>
    </div>
  );
};