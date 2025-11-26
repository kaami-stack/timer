import { Settings, Task, DailyStats } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const KEYS = {
  SETTINGS: 'serene_settings',
  TASKS: 'serene_tasks',
  STATS: 'serene_stats',
};

export const getSettings = (): Settings => {
  try {
    const stored = localStorage.getItem(KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

export const getTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(KEYS.TASKS);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
};

export const getStats = (): DailyStats[] => {
  try {
    const stored = localStorage.getItem(KEYS.STATS);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const saveStats = (stats: DailyStats[]) => {
  localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
};