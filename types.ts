export enum TimerMode {
  FOCUS = 'FOCUS',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK'
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export interface Settings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  soundscape: string;
  soundscapeVolume: number;
  darkMode: boolean;
  isPremium: boolean; // Simulates Ad-Free purchase
  theme: string;
  personalizedAds: boolean;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  minutesFocused: number;
  sessionsCompleted: number;
}