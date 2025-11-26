
import { TimerMode, Settings } from './types';

export const SOUNDSCAPES = [
  { id: 'none', label: 'Silent', url: '' },
  { id: 'rain', label: 'Gentle Rain', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
  { id: 'forest', label: 'Forest Ambiance', url: 'https://actions.google.com/sounds/v1/birds/forest_birds_ambience.ogg' },
  { id: 'fire', label: 'Cozy Fireplace', url: 'https://actions.google.com/sounds/v1/ambiences/fire.ogg' },
  { id: 'waves', label: 'Ocean Waves', url: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rocks_1.ogg' }
];

export const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  soundscape: 'none',
  soundscapeVolume: 50,
  darkMode: false,
  isPremium: false,
  theme: 'rose',
  personalizedAds: true,
  dailyGoalType: 'minutes',
  dailyGoalTarget: 120,
};

// Deprecated: Use THEME_PALETTES via App logic instead
export const THEME_COLORS = {
  [TimerMode.FOCUS]: 'text-rose-400 dark:text-rose-300 stroke-rose-400 dark:stroke-rose-300',
  [TimerMode.SHORT_BREAK]: 'text-teal-400 dark:text-teal-300 stroke-teal-400 dark:stroke-teal-300',
  [TimerMode.LONG_BREAK]: 'text-indigo-400 dark:text-indigo-300 stroke-indigo-400 dark:stroke-indigo-300',
};

export const MODE_LABELS = {
  [TimerMode.FOCUS]: 'Focus',
  [TimerMode.SHORT_BREAK]: 'Short Break',
  [TimerMode.LONG_BREAK]: 'Long Break',
};

export const THEME_PALETTES: Record<string, any> = {
  rose: {
    label: 'Rose',
    color: 'bg-rose-400',
    modes: {
      [TimerMode.FOCUS]: 'text-rose-400 dark:text-rose-300 stroke-rose-400 dark:stroke-rose-300',
      [TimerMode.SHORT_BREAK]: 'text-teal-400 dark:text-teal-300 stroke-teal-400 dark:stroke-teal-300',
      [TimerMode.LONG_BREAK]: 'text-indigo-400 dark:text-indigo-300 stroke-indigo-400 dark:stroke-indigo-300',
    },
    ui: {
      primary: 'bg-rose-400',
      primaryHover: 'hover:bg-rose-500',
      text: 'text-rose-400',
      border: 'border-rose-400',
      ring: 'focus:ring-rose-200',
      checkbox: 'text-rose-400',
    }
  },
  ocean: {
    label: 'Ocean',
    color: 'bg-sky-400',
    modes: {
      [TimerMode.FOCUS]: 'text-sky-400 dark:text-sky-300 stroke-sky-400 dark:stroke-sky-300',
      [TimerMode.SHORT_BREAK]: 'text-cyan-400 dark:text-cyan-300 stroke-cyan-400 dark:stroke-cyan-300',
      [TimerMode.LONG_BREAK]: 'text-blue-400 dark:text-blue-300 stroke-blue-400 dark:stroke-blue-300',
    },
    ui: {
      primary: 'bg-sky-400',
      primaryHover: 'hover:bg-sky-500',
      text: 'text-sky-400',
      border: 'border-sky-400',
      ring: 'focus:ring-sky-200',
      checkbox: 'text-sky-400',
    }
  },
  forest: {
    label: 'Forest',
    color: 'bg-emerald-400',
    modes: {
      [TimerMode.FOCUS]: 'text-emerald-400 dark:text-emerald-300 stroke-emerald-400 dark:stroke-emerald-300',
      [TimerMode.SHORT_BREAK]: 'text-lime-400 dark:text-lime-300 stroke-lime-400 dark:stroke-lime-300',
      [TimerMode.LONG_BREAK]: 'text-teal-400 dark:text-teal-300 stroke-teal-400 dark:stroke-teal-300',
    },
    ui: {
      primary: 'bg-emerald-400',
      primaryHover: 'hover:bg-emerald-500',
      text: 'text-emerald-400',
      border: 'border-emerald-400',
      ring: 'focus:ring-emerald-200',
      checkbox: 'text-emerald-400',
    }
  },
  lavender: {
    label: 'Lavender',
    color: 'bg-violet-400',
    modes: {
      [TimerMode.FOCUS]: 'text-violet-400 dark:text-violet-300 stroke-violet-400 dark:stroke-violet-300',
      [TimerMode.SHORT_BREAK]: 'text-fuchsia-400 dark:text-fuchsia-300 stroke-fuchsia-400 dark:stroke-fuchsia-300',
      [TimerMode.LONG_BREAK]: 'text-purple-400 dark:text-purple-300 stroke-purple-400 dark:stroke-purple-300',
    },
    ui: {
      primary: 'bg-violet-400',
      primaryHover: 'hover:bg-violet-500',
      text: 'text-violet-400',
      border: 'border-violet-400',
      ring: 'focus:ring-violet-200',
      checkbox: 'text-violet-400',
    }
  }
};

// Gentle chime sound (Base64 placeholder to avoid external dependency issues in preview)
export const ALARM_SOUND_BASE64 = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Truncated for brevity, normally a full wav
