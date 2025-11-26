import React from 'react';
import { RotateCcw } from 'lucide-react';
import { TimerMode } from '../types';

interface TimerDisplayProps {
  timeLeft: number;
  totalTime: number;
  mode: TimerMode;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  themeColorClass: string;
  progressColor: string;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  timeLeft, 
  totalTime, 
  mode, 
  isRunning,
  onToggle,
  onReset,
  themeColorClass,
  progressColor
}) => {
  const radius = 120;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Calculate stroke offset for circle
  const strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;

  // Calculate percentage for linear bar
  const progressPercentage = Math.min(100, Math.max(0, ((totalTime - timeLeft) / totalTime) * 100));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Extract just the text color class from the combined class string for the number
  const textColorClass = themeColorClass.split(' ').find(c => c.startsWith('text-')) || '';

  return (
    <div className="relative flex flex-col items-center justify-center gap-8">
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="rotate-[-90deg] transition-all duration-500"
        >
          <circle
            className="stroke-gray-200 dark:stroke-gray-700"
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            className={`${themeColorClass} transition-all duration-1000 ease-linear`}
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center gap-4">
          <span className={`text-6xl font-light tracking-tight tabular-nums ${textColorClass}`}>
            {formatTime(timeLeft)}
          </span>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onToggle}
              className={`px-8 py-2 rounded-full font-medium transition-all transform active:scale-95 shadow-sm
                ${isRunning 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300' 
                  : 'bg-pastel-dark dark:bg-pastel-mint text-white dark:text-pastel-dark'}`}
            >
              {isRunning ? 'PAUSE' : 'START'}
            </button>
            
            <button
              onClick={onReset}
              aria-label="Reset Timer"
              title="Reset Timer"
              className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Linear Progress Bar */}
      <div className="w-full max-w-[200px] h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${progressColor}`} 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};