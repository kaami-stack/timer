import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Settings as SettingsIcon, List, BarChart2, Shield, Lock, FileText, ChevronLeft, Moon, Sun, Plus, Trash2, Check, RefreshCw, Flame, GripVertical, Edit2, Palette, X, Music, Volume2, Headphones, HelpCircle, MousePointerClick, Move, MoreHorizontal, ShieldAlert, ArrowDownAZ, CheckCircle, LayoutList } from 'lucide-react';
import { TimerMode, Settings, Task, DailyStats } from './types';
import { DEFAULT_SETTINGS, MODE_LABELS, THEME_PALETTES, SOUNDSCAPES } from './constants';
import * as Storage from './services/storageService';
import { TimerDisplay } from './components/TimerDisplay';
import { AdBanner } from './components/AdBanner';
import { RewardedAdModal } from './components/RewardedAdModal';

// --- Components ---

const Toast: React.FC<{ message: string; show: boolean }> = ({ message, show }) => {
  if (!show) return null;
  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-900/90 dark:bg-white/90 backdrop-blur-sm text-white dark:text-gray-900 px-6 py-2.5 rounded-full shadow-xl text-sm font-medium z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none select-none">
      {message}
    </div>
  );
};

const SoundscapeControl: React.FC<{
  settings: Settings;
  updateSettings: (s: Settings) => void;
  className?: string;
  themeUI: any;
}> = ({ settings, updateSettings, className, themeUI }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ ...settings, soundscapeVolume: parseInt(e.target.value) });
  };

  const handleSoundSelect = (id: string) => {
    updateSettings({ ...settings, soundscape: id });
  };

  const activeSound = SOUNDSCAPES.find(s => s.id === settings.soundscape);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full shadow-sm hover:shadow-md transition-all ${
          activeSound && activeSound.id !== 'none' 
            ? `${themeUI.primary} text-white` 
            : 'bg-white dark:bg-pastel-darkSurface text-gray-600 dark:text-gray-300'
        }`}
        title="Ambient Soundscapes"
      >
        <Headphones size={20} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-pastel-darkSurface rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-3 text-gray-800 dark:text-white font-medium">
            <Music size={16} />
            <span>Soundscapes</span>
          </div>
          
          <div className="space-y-2 mb-4">
            {SOUNDSCAPES.map((sound) => (
              <button
                key={sound.id}
                onClick={() => handleSoundSelect(sound.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  settings.soundscape === sound.id
                    ? `${themeUI.primary} text-white`
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <span>{sound.label}</span>
                {settings.soundscape === sound.id && <Volume2 size={14} />}
              </button>
            ))}
          </div>

          <div className="space-y-1">
             <div className="flex justify-between text-xs text-gray-500">
               <span>Volume</span>
               <span>{settings.soundscapeVolume}%</span>
             </div>
             <input 
               type="range" 
               min="0" 
               max="100" 
               value={settings.soundscapeVolume} 
               onChange={handleVolumeChange}
               className={`w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-${themeUI.text.split('-')[1]}-500`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// --- Pages ---

const HomePage: React.FC<{
  settings: Settings;
  updateSettings: (s: Settings) => void;
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  stats: DailyStats[];
  setStats: (s: DailyStats[]) => void;
}> = ({ settings, updateSettings, tasks, setTasks, stats, setStats }) => {
  const [mode, setMode] = useState<TimerMode>(TimerMode.FOCUS);
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showRewardedModal, setShowRewardedModal] = useState(false);
  
  // Resolve Theme
  const currentTheme = THEME_PALETTES[settings.theme] || THEME_PALETTES['rose'];
  
  // Context Menu & Editing State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: string } | null>(null);
  const [editingTask, setEditingTask] = useState<{ id: string; title: string } | null>(null);
  
  // Sorting State
  const [sortBy, setSortBy] = useState<'order' | 'alpha' | 'status'>('order');

  // Toast State
  const [toast, setToast] = useState({ message: '', show: false });
  const toastTimeoutRef = useRef<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundscapeRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  
  const dragItem = useRef<number | null>(null);
  const longPressRef = useRef<number | null>(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    // Soundscape element creation
    soundscapeRef.current = new Audio();
    soundscapeRef.current.loop = true;
    
    return () => {
        if (soundscapeRef.current) {
            soundscapeRef.current.pause();
            soundscapeRef.current.src = "";
        }
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, []);

  // Handle Soundscape Logic
  useEffect(() => {
      const audio = soundscapeRef.current;
      if (!audio) return;

      const activeSound = SOUNDSCAPES.find(s => s.id === settings.soundscape);
      const targetVolume = settings.soundscapeVolume / 100;

      // Clear any existing fade
      if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
      }

      if (activeSound && activeSound.id !== 'none' && activeSound.url) {
          // If source changed, update it
          // Note: audio.src property returns full URL, so we compare carefully
          if (!audio.src.includes(activeSound.url)) {
              audio.src = activeSound.url;
              audio.load();
          }

          if (isRunning) {
              // Fade In / Play
              audio.play().catch(e => console.log("Soundscape play prevented:", e));
              
              const startVolume = audio.volume;
              const steps = 20;
              const duration = 1000;
              const stepTime = duration / steps;
              const volStep = (targetVolume - startVolume) / steps;
              let currentStep = 0;
              
              fadeIntervalRef.current = window.setInterval(() => {
                  currentStep++;
                  let newVol = startVolume + (volStep * currentStep);
                  // Clamp
                  newVol = Math.max(0, Math.min(1, newVol));
                  
                  // Final check to ensure we reach exact target
                  if (currentStep >= steps) newVol = targetVolume;
                  
                  audio.volume = newVol;

                  if (currentStep >= steps) {
                       if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
                  }
              }, stepTime);

          } else {
              // Fade Out
              if (audio.paused) return; // Already paused

              const startVolume = audio.volume;
              const steps = 20;
              const duration = 1000; 
              const stepTime = duration / steps;
              const volStep = startVolume / steps; // Fade to 0
              let currentStep = 0;

              fadeIntervalRef.current = window.setInterval(() => {
                  currentStep++;
                  let newVol = startVolume - (volStep * currentStep);
                  newVol = Math.max(0, newVol);
                  audio.volume = newVol;

                  if (currentStep >= steps || newVol <= 0) {
                      audio.pause();
                      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
                  }
              }, stepTime);
          }
      } else {
          audio.pause();
      }
  }, [isRunning, settings.soundscape, settings.soundscapeVolume]);

  // Close context menu on global click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const playSound = useCallback(() => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play failed interaction needed", e));
    }
  }, [settings.soundEnabled]);

  const updateStats = useCallback((durationMinutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newStats = [...stats];
    const todayStatsIndex = newStats.findIndex(s => s.date === today);

    if (todayStatsIndex >= 0) {
      newStats[todayStatsIndex].minutesFocused += durationMinutes;
      newStats[todayStatsIndex].sessionsCompleted += 1;
    } else {
      newStats.push({ date: today, minutesFocused: durationMinutes, sessionsCompleted: 1 });
    }
    setStats(newStats);
    Storage.saveStats(newStats);
  }, [stats, setStats]);

  // Calculate Streak
  const currentStreak = useMemo(() => {
    const activeDates = new Set(
      stats
        .filter(s => s.sessionsCompleted > 0)
        .map(s => s.date)
    );
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let currentCheckDate = new Date(today);
    if (!activeDates.has(todayStr)) {
        if (activeDates.has(yesterdayStr)) {
            currentCheckDate = yesterday;
        } else {
            return 0;
        }
    }
    let count = 0;
    let safety = 0;
    while (safety < 10000) {
        const dateStr = currentCheckDate.toISOString().split('T')[0];
        if (activeDates.has(dateStr)) {
            count++;
            currentCheckDate.setDate(currentCheckDate.getDate() - 1);
        } else {
            break;
        }
        safety++;
    }
    return count;
  }, [stats]);

  const handleTimerComplete = useCallback(() => {
    playSound();
    setIsRunning(false);
    
    // Logic for auto-switching
    if (mode === TimerMode.FOCUS) {
      updateStats(settings.focusDuration);
      if (settings.autoStartBreaks) {
        setMode(TimerMode.SHORT_BREAK);
        setTimeLeft(settings.shortBreakDuration * 60);
        setIsRunning(true);
      } else {
        setMode(TimerMode.SHORT_BREAK);
        setTimeLeft(settings.shortBreakDuration * 60);
      }
    } else {
      if (settings.autoStartPomodoros) {
         setMode(TimerMode.FOCUS);
         setTimeLeft(settings.focusDuration * 60);
         setIsRunning(true);
      } else {
         setMode(TimerMode.FOCUS);
         setTimeLeft(settings.focusDuration * 60);
      }
    }
  }, [mode, playSound, settings, updateStats]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, handleTimerComplete]);

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    switch (newMode) {
      case TimerMode.FOCUS: setTimeLeft(settings.focusDuration * 60); break;
      case TimerMode.SHORT_BREAK: setTimeLeft(settings.shortBreakDuration * 60); break;
      case TimerMode.LONG_BREAK: setTimeLeft(settings.longBreakDuration * 60); break;
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    switch (mode) {
      case TimerMode.FOCUS: setTimeLeft(settings.focusDuration * 60); break;
      case TimerMode.SHORT_BREAK: setTimeLeft(settings.shortBreakDuration * 60); break;
      case TimerMode.LONG_BREAK: setTimeLeft(settings.longBreakDuration * 60); break;
    }
  };

  // Toast Helper
  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message: msg, show: true });
    toastTimeoutRef.current = window.setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
    }, 2000);
  };

  // Task Management
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = { id: Date.now().toString(), title: newTaskTitle, completed: false };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    Storage.saveTasks(updatedTasks);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === id) {
        const isCompleted = !t.completed;
        showToast(isCompleted ? "Task Completed" : "Task Unmarked");
        return { ...t, completed: isCompleted };
      }
      return t;
    });
    setTasks(updatedTasks);
    Storage.saveTasks(updatedTasks);
  };

  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    Storage.saveTasks(updatedTasks);
    showToast("Task Deleted");
  };

  // Editing Handlers
  const startEditing = (task: Task) => {
    setEditingTask({ id: task.id, title: task.title });
    setContextMenu(null);
  };

  const saveEdit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editingTask && editingTask.title.trim()) {
      const updatedTasks = tasks.map(t => t.id === editingTask.id ? { ...t, title: editingTask.title.trim() } : t);
      setTasks(updatedTasks);
      Storage.saveTasks(updatedTasks);
    }
    setEditingTask(null);
  };

  // Context Menu Handlers
  const handleContextMenu = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, taskId: task.id });
  };

  const handleTouchStart = (e: React.TouchEvent, task: Task) => {
    const touch = e.touches[0];
    const { clientX, clientY } = touch;
    longPressRef.current = window.setTimeout(() => {
      setContextMenu({ x: clientX, y: clientY, taskId: task.id });
    }, 500); 
  };

  const handleTouchEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handleTouchMove = () => {
     if (longPressRef.current) {
        clearTimeout(longPressRef.current);
        longPressRef.current = null;
     }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    if (dragItem.current === null || dragItem.current === position) return;

    const newTasks = [...tasks];
    const draggedItemContent = newTasks[dragItem.current];
    
    newTasks.splice(dragItem.current, 1);
    newTasks.splice(position, 0, draggedItemContent);
    
    dragItem.current = position;
    setTasks(newTasks);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    Storage.saveTasks(tasks);
  };

  // Sorting Logic
  const sortedTasks = useMemo(() => {
    if (sortBy === 'order') return tasks;
    
    const copy = [...tasks];
    if (sortBy === 'alpha') {
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === 'status') {
      // Incomplete first, Complete last
      return copy.sort((a, b) => Number(a.completed) - Number(b.completed));
    }
    return tasks;
  }, [tasks, sortBy]);

  const totalTime = mode === TimerMode.FOCUS ? settings.focusDuration * 60 
    : mode === TimerMode.SHORT_BREAK ? settings.shortBreakDuration * 60 
    : settings.longBreakDuration * 60;

  return (
    <div className={`flex flex-col h-full ${!settings.isPremium ? 'pb-20' : ''}`}>
      {/* Header */}
      <header className="p-6 flex justify-between items-center relative z-20">
        <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100">SereneFocus</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-full border border-orange-100 dark:border-orange-800/30 transition-colors">
            <Flame size={16} className={`text-orange-400 ${currentStreak > 0 ? 'fill-orange-400' : ''}`} />
            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 tabular-nums">{currentStreak}</span>
          </div>
          
          <SoundscapeControl 
             settings={settings} 
             updateSettings={updateSettings} 
             themeUI={currentTheme.ui}
          />
          
          <Link to="/settings" className="p-2 bg-white dark:bg-pastel-darkSurface rounded-full shadow-sm hover:shadow-md transition-shadow">
            <SettingsIcon size={20} className="text-gray-600 dark:text-gray-300" />
          </Link>
        </div>
      </header>

      {/* Timer Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
        
        {/* Mode Selector */}
        <div className="flex bg-gray-100 dark:bg-pastel-darkSurface p-1 rounded-full relative z-10">
          {Object.values(TimerMode).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-2 text-sm rounded-full transition-all ${
                mode === m 
                  ? 'bg-white dark:bg-gray-600 shadow-sm font-medium text-gray-800 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <TimerDisplay 
          timeLeft={timeLeft} 
          totalTime={totalTime} 
          mode={mode} 
          isRunning={isRunning}
          onToggle={() => setIsRunning(!isRunning)}
          onReset={resetTimer}
          themeColorClass={currentTheme.modes[mode]}
          progressColor={currentTheme.ui.primary}
        />

        {/* Task Section */}
        <div className="w-full max-w-md mt-6 relative z-10">
          <div className="flex items-center justify-between mb-2 px-1">
             <div className="flex items-center gap-2">
               <List size={18} className="text-gray-400" />
               <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Tasks</h2>
             </div>
             
             {/* Sort Controls */}
             <div className="flex bg-gray-100 dark:bg-pastel-darkSurface p-0.5 rounded-lg">
                <button 
                  onClick={() => setSortBy('order')}
                  title="Sort by Order"
                  className={`p-1.5 rounded-md transition-all ${sortBy === 'order' ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutList size={14} />
                </button>
                <button 
                  onClick={() => setSortBy('alpha')}
                  title="Sort Alphabetically"
                  className={`p-1.5 rounded-md transition-all ${sortBy === 'alpha' ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <ArrowDownAZ size={14} />
                </button>
                <button 
                  onClick={() => setSortBy('status')}
                  title="Sort by Status"
                  className={`p-1.5 rounded-md transition-all ${sortBy === 'status' ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <CheckCircle size={14} />
                </button>
             </div>
          </div>
          
          <form onSubmit={addTask} className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What are you working on?"
              className={`flex-1 px-4 py-3 rounded-xl bg-white dark:bg-pastel-darkSurface border-none shadow-sm focus:ring-2 outline-none dark:text-white ${currentTheme.ui.ring}`}
            />
            <button type="submit" className={`p-3 text-white rounded-xl shadow-sm transition-colors ${currentTheme.ui.primary} ${currentTheme.ui.primaryHover}`}>
              <Plus size={20} />
            </button>
          </form>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {sortedTasks.map((task, index) => (
              <div 
                key={task.id}
                draggable={sortBy === 'order'}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                onContextMenu={(e) => handleContextMenu(e, task)}
                onTouchStart={(e) => handleTouchStart(e, task)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                className={`group flex items-center justify-between p-3 bg-white/60 dark:bg-pastel-darkSurface/60 rounded-xl hover:bg-white dark:hover:bg-pastel-darkSurface cursor-default relative select-none transition-all duration-300 ease-out
                   ${task.completed ? 'opacity-60 scale-[0.98] grayscale' : 'opacity-100 scale-100'}`}
              >
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  {sortBy === 'order' && (
                    <div className="cursor-move text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400">
                      <GripVertical size={16} />
                    </div>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      task.completed 
                        ? `${currentTheme.ui.primary} ${currentTheme.ui.border}` 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {task.completed && <Check size={12} className="text-white animate-in zoom-in duration-200" />}
                  </button>
                  
                  {editingTask?.id === task.id ? (
                    <form onSubmit={saveEdit} className="flex-1 flex" onClick={e => e.stopPropagation()}>
                        <input 
                            autoFocus
                            type="text"
                            value={editingTask.title}
                            onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                            onBlur={() => saveEdit()}
                            onKeyDown={(e) => {
                                if(e.key === 'Escape') setEditingTask(null);
                            }}
                            className={`w-full bg-transparent border-b outline-none text-gray-800 dark:text-gray-100 text-sm p-0 pb-0.5 ${currentTheme.ui.border}`}
                        />
                    </form>
                  ) : (
                    <span 
                      onDoubleClick={() => startEditing(task)}
                      className={`text-sm truncate transition-all duration-300 ${task.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                      {task.title}
                    </span>
                  )}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {tasks.length === 0 && (
               <p className="text-center text-gray-400 text-sm py-4">No tasks yet. Stay focused!</p>
            )}
          </div>
        </div>

        {/* Toast Notification */}
        <Toast message={toast.message} show={toast.show} />

        {/* Context Menu Portal */}
        {contextMenu && (
            <div 
                className="fixed z-50 bg-white dark:bg-pastel-darkSurface shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 w-48 py-1.5 animate-in fade-in zoom-in-95 duration-100"
                style={{ 
                    top: Math.min(contextMenu.y, window.innerHeight - 150), 
                    left: Math.min(contextMenu.x, window.innerWidth - 200) 
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {(() => {
                   const task = tasks.find(t => t.id === contextMenu.taskId);
                   if (!task) return null;
                   return (
                     <>
                        <button onClick={() => startEditing(task)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2.5">
                            <Edit2 size={15} /> Edit Task
                        </button>
                        <button onClick={() => { toggleTask(task.id); setContextMenu(null); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2.5">
                            {task.completed ? <X size={15} /> : <Check size={15} />} 
                            {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                        </button>
                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                        <button onClick={() => { deleteTask(task.id); setContextMenu(null); }} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5">
                            <Trash2 size={15} /> Delete Task
                        </button>
                     </>
                   );
                })()}
            </div>
        )}

        {/* Unlock Theme Demo */}
        {!settings.isPremium && (
          <button 
            onClick={() => setShowRewardedModal(true)}
            className="text-xs text-indigo-400 hover:text-indigo-600 flex items-center gap-1 mt-4"
          >
             <RefreshCw size={12} /> Unlock Premium Theme (Ad)
          </button>
        )}
      </main>

      <RewardedAdModal 
        isOpen={showRewardedModal} 
        onClose={() => setShowRewardedModal(false)} 
        onReward={() => alert("Theme Unlocked! (Simulation)")}
      />
    </div>
  );
};

const HelpPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-pastel-cream dark:bg-pastel-dark flex flex-col">
       <header className="p-6 flex items-center gap-4 bg-white dark:bg-pastel-darkSurface shadow-sm">
        <Link to="/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-200">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">How to Use</h1>
      </header>

      <div className="p-6 space-y-6 max-w-2xl mx-auto w-full pb-24">
        
        {/* Intro */}
        <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Welcome to SereneFocus</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                A calm, distraction-free environment to help you stay productive. Here is a quick guide to getting the most out of your focus sessions.
            </p>
        </section>

        {/* Task Management */}
        <section className="bg-white dark:bg-pastel-darkSurface rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2 text-rose-500">
                <List size={20} />
                <h3 className="font-bold uppercase tracking-wide text-sm">Task Mastery</h3>
            </div>
            
            <div className="space-y-4">
                <div className="flex gap-4 items-start">
                    <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-rose-500 mt-1">
                        <Move size={18} />
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">Prioritize with Drag & Drop</h4>
                        <p className="text-xs text-gray-500 mt-1">Grab the <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">⋮⋮</span> handle on the left of any task to reorder your list. Keep your most important task at the top.</p>
                    </div>
                </div>

                <div className="flex gap-4 items-start">
                    <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-rose-500 mt-1">
                        <MousePointerClick size={18} />
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">Quick Edit</h4>
                        <p className="text-xs text-gray-500 mt-1">Double-click on any task text to instantly edit it. Press Enter to save or Escape to cancel.</p>
                    </div>
                </div>

                <div className="flex gap-4 items-start">
                    <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-rose-500 mt-1">
                        <MoreHorizontal size={18} />
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">Advanced Actions</h4>
                        <p className="text-xs text-gray-500 mt-1">Right-click (Desktop) or Long-Press (Mobile) on a task to open the menu. Here you can delete tasks or mark completed tasks as incomplete.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Ambiance */}
        <section className="bg-white dark:bg-pastel-darkSurface rounded-2xl p-5 shadow-sm space-y-4">
             <div className="flex items-center gap-2 mb-2 text-indigo-500">
                <Headphones size={20} />
                <h3 className="font-bold uppercase tracking-wide text-sm">Ambiance & Sound</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Tap the <Headphones size={14} className="inline mx-1"/> icon in the header to access Soundscapes. Choose from rain, forest, or white noise. 
                <br/><br/>
                <span className="font-semibold text-xs uppercase text-indigo-400">Pro Tip:</span> The soundscape fades in when you start the timer and fades out when you pause, keeping you in the flow.
            </p>
        </section>

        {/* Ads & Data */}
        <section className="bg-white dark:bg-pastel-darkSurface rounded-2xl p-5 shadow-sm space-y-4 border-l-4 border-gray-300 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-200">
                <ShieldAlert size={20} />
                <h3 className="font-bold uppercase tracking-wide text-sm">Ads & Your Data</h3>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
                <p>
                    We believe in transparency. Here is how advertising works in SereneFocus:
                </p>
                <ul className="list-disc pl-5 space-y-2 marker:text-gray-400">
                    <li>
                        <strong>No Personal Data Collection:</strong> We do not create user accounts or store your tasks/settings on our servers. Everything stays on your device.
                    </li>
                    <li>
                        <strong>Google AdMob:</strong> We use Google AdMob to display the small banner at the bottom and the optional rewarded videos.
                    </li>
                    <li>
                        <strong>Ad Personalization:</strong> AdMob may use your device's advertising ID to serve relevant ads. You can opt-out of this in your device settings or request non-personalized ads in our Settings menu.
                    </li>
                    <li>
                        <strong>Premium Option:</strong> You can permanently remove all ads via the "Go Ad-Free" option in Settings.
                    </li>
                </ul>
            </div>
        </section>

      </div>
    </div>
  );
};

const DataSafetyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-pastel-dark p-6">
       <Link to="/settings" className="inline-flex items-center gap-2 text-gray-500 mb-6">
         <ChevronLeft size={20} /> Back
       </Link>
       <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Data Safety</h1>
       
       <div className="space-y-6">
         <section className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
            <div className="flex items-center gap-2 mb-2 text-green-700 dark:text-green-400 font-bold">
               <Shield size={20} />
               <h2>Local Storage Only</h2>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
               SereneFocus is designed with privacy as a priority. <strong>All your data</strong> (tasks, timer history, settings, statistics) is stored exclusively on your local device. 
            </p>
         </section>

         <div className="prose dark:prose-invert text-sm text-gray-600 dark:text-gray-300 space-y-4">
             <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">No Remote Servers</h3>
                <p>We do not operate backend servers to store your personal information. We cannot see, access, or sell your task lists or productivity habits.</p>
             </div>
             
             <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">No Account Required</h3>
                <p>You can use all features of the app without creating an account or logging in.</p>
             </div>

             <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Advertising Data</h3>
                <p>
                   To support the development of the app, we use <strong>Google AdMob</strong> to display advertisements. 
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                   <li>AdMob may collect standard device information (like Advertising ID) to serve relevant ads.</li>
                   <li>You can control ad personalization in the App Settings.</li>
                   <li>If you purchase the Premium version, the ad network code is disabled.</li>
                </ul>
             </div>
         </div>
       </div>
    </div>
  );
};

const SettingsPage: React.FC<{ 
  settings: Settings; 
  updateSettings: (s: Settings) => void; 
}> = ({ settings, updateSettings }) => {
  const currentTheme = THEME_PALETTES[settings.theme] || THEME_PALETTES['rose'];
  
  const toggleSetting = (key: keyof Settings) => {
    updateSettings({ ...settings, [key]: !settings[key] });
  };

  const handleDurationChange = (key: keyof Settings, val: number) => {
    updateSettings({ ...settings, [key]: val });
  };

  const handleSoundscapeChange = (id: string) => {
    updateSettings({ ...settings, soundscape: id });
  };

  const purchasePremium = () => {
    // Simulating IAP
    if (confirm("Simulate In-App Purchase for Ad-Free version?")) {
      updateSettings({ ...settings, isPremium: true });
    }
  };

  return (
    <div className="min-h-screen bg-pastel-cream dark:bg-pastel-dark flex flex-col">
       <header className="p-6 flex items-center gap-4 bg-white dark:bg-pastel-darkSurface shadow-sm">
        <Link to="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-200">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Settings</h1>
      </header>
      
      <div className="p-6 space-y-6 max-w-lg mx-auto w-full pb-24">
        
        {/* Appearance & Sound */}
        <section className="bg-white dark:bg-pastel-darkSurface rounded-2xl p-4 shadow-sm space-y-4">
           <h2 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-2">Appearance</h2>
           
           {/* Theme Selection */}
           <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
             <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Palette size={18} />
                    <span>Color Theme</span>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {THEME_PALETTES[settings.theme]?.label || 'Rose'}
                </span>
             </div>
             <div className="flex gap-4 justify-start">
               {Object.entries(THEME_PALETTES).map(([key, palette]) => (
                 <button
                   key={key}
                   onClick={() => updateSettings({ ...settings, theme: key })}
                   className={`w-10 h-10 rounded-full ${palette.color} shadow-sm transition-transform hover:scale-105 flex items-center justify-center`}
                   aria-label={`Select ${palette.label} theme`}
                 >
                   {settings.theme === key && (
                     <div className="w-11 h-11 rounded-full border-2 border-gray-400 dark:border-gray-200 absolute"></div>
                   )}
                   {settings.theme === key && <Check size={16} className="text-white" />}
                 </button>
               ))}
             </div>
           </div>

           <button onClick={() => toggleSetting('darkMode')} className="flex items-center justify-between w-full">
             <div className="flex items-center gap-3">
               {settings.darkMode ? <Moon size={18} /> : <Sun size={18} />}
               <span className="text-gray-700 dark:text-gray-200">Dark Mode</span>
             </div>
             <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.darkMode ? 'bg-indigo-400' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.darkMode ? 'translate-x-4' : ''}`} />
             </div>
           </button>
        </section>

        {/* Ambient Soundscapes Section (New) */}
        <section className="bg-white dark:bg-pastel-darkSurface rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1 text-gray-700 dark:text-gray-200">
            <Headphones size={18} />
            <h2 className="text-sm font-bold uppercase text-gray-400 tracking-wider">Ambient Soundscapes</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {SOUNDSCAPES.map((sound) => (
              <button
                key={sound.id}
                onClick={() => handleSoundscapeChange(sound.id)}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                  settings.soundscape === sound.id
                  ? `${currentTheme.ui.border} bg-gray-50 dark:bg-gray-800`
                  : 'border-transparent bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className={`font-medium text-sm ${settings.soundscape === sound.id ? currentTheme.ui.text : 'text-gray-600 dark:text-gray-300'}`}>
                  {sound.label}
                </span>
              </button>
            ))}
          </div>
          
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs text-gray-500">
               <span>Master Volume</span>
               <span>{settings.soundscapeVolume}%</span>
            </div>
            <input 
               type="range" 
               min="0" 
               max="100" 
               value={settings.soundscapeVolume} 
               onChange={(e) => updateSettings({ ...settings, soundscapeVolume: parseInt(e.target.value) })}
               className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-${currentTheme.ui.text.split('-')[1]}-500`}
            />
          </div>
        </section>

        {/* Timer Config */}
        <section className="bg-white dark:bg-pastel-darkSurface rounded-2xl p-4 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-2">Timer</h2>
          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-1">
               <label className="text-xs text-gray-500">Focus (m)</label>
               <input 
                 type="number" 
                 value={settings.focusDuration} 
                 onChange={(e) => handleDurationChange('focusDuration', parseInt(e.target.value))}
                 className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-center dark:text-white"
               />
             </div>
             <div className="space-y-1">
               <label className="text-xs text-gray-500">Short Break</label>
               <input 
                 type="number" 
                 value={settings.shortBreakDuration} 
                 onChange={(e) => handleDurationChange('shortBreakDuration', parseInt(e.target.value))}
                 className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-center dark:text-white"
               />
             </div>
             <div className="space-y-1">
               <label className="text-xs text-gray-500">Long Break</label>
               <input 
                 type="number" 
                 value={settings.longBreakDuration} 
                 onChange={(e) => handleDurationChange('longBreakDuration', parseInt(e.target.value))}
                 className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-center dark:text-white"
               />
             </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <span className="text-gray-700 dark:text-gray-200">Auto-start Breaks</span>
            <input 
              type="checkbox" 
              checked={settings.autoStartBreaks} 
              onChange={() => toggleSetting('autoStartBreaks')}
              className={`w-5 h-5 rounded ${currentTheme.ui.text} focus:ring-0`}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-200">Auto-start Focus</span>
            <input 
              type="checkbox" 
              checked={settings.autoStartPomodoros} 
              onChange={() => toggleSetting('autoStartPomodoros')}
              className={`w-5 h-5 rounded ${currentTheme.ui.text} focus:ring-0`}
            />
          </div>
          
          <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
          
           <button onClick={() => toggleSetting('soundEnabled')} className="flex items-center justify-between w-full">
             <div className="flex items-center gap-3">
               <span className="text-gray-700 dark:text-gray-200">Sound Effects</span>
             </div>
             <input type="checkbox" checked={settings.soundEnabled} onChange={() => toggleSetting('soundEnabled')} className={`w-5 h-5 rounded ${currentTheme.ui.text} focus:ring-0`} />
           </button>
        </section>

        {/* Ad Preferences */}
        {!settings.isPremium && (
          <section className="bg-white dark:bg-pastel-darkSurface rounded-2xl p-4 shadow-sm space-y-4">
             <div className="flex items-center gap-2 mb-1 text-gray-700 dark:text-gray-200">
                <ShieldAlert size={18} />
                <h2 className="text-sm font-bold uppercase text-gray-400 tracking-wider">Ad Privacy</h2>
             </div>
             
             <button onClick={() => toggleSetting('personalizedAds')} className="flex items-center justify-between w-full">
               <div className="text-left">
                 <span className="block text-gray-700 dark:text-gray-200 text-sm font-medium">Personalized Ads</span>
                 <span className="block text-xs text-gray-500 mt-0.5">Allow Google to show relevant ads</span>
               </div>
               <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.personalizedAds ? 'bg-indigo-400' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.personalizedAds ? 'translate-x-4' : ''}`} />
               </div>
             </button>
          </section>
        )}

        {/* Premium */}
        <section className="bg-gradient-to-r from-rose-100 to-indigo-100 dark:from-rose-900 dark:to-indigo-900 rounded-2xl p-6 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white mb-1">SereneFocus Premium</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Remove ads and support development.</p>
              </div>
              <Shield className="text-indigo-500" size={32} />
           </div>
           {settings.isPremium ? (
             <div className="px-4 py-2 bg-white/50 dark:bg-black/20 rounded-lg text-center font-bold text-indigo-600 dark:text-indigo-300">
               Active
             </div>
           ) : (
             <button onClick={purchasePremium} className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:opacity-90 transition-opacity">
               Go Ad-Free ($1.99)
             </button>
           )}
        </section>

        {/* Legal */}
        <section className="bg-white dark:bg-pastel-darkSurface rounded-2xl p-4 shadow-sm space-y-1">
          <Link to="/help" className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <span className="flex items-center gap-3 text-gray-700 dark:text-gray-200"><HelpCircle size={16} /> Help & Guide</span>
            <ChevronLeft size={16} className="rotate-180 text-gray-400" />
          </Link>
          <div className="h-px bg-gray-100 dark:bg-gray-700 mx-3 my-1"></div>
          <Link to="/privacy" className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <span className="flex items-center gap-3 text-gray-700 dark:text-gray-200"><Lock size={16} /> Privacy Policy</span>
            <ChevronLeft size={16} className="rotate-180 text-gray-400" />
          </Link>
          <Link to="/terms" className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <span className="flex items-center gap-3 text-gray-700 dark:text-gray-200"><FileText size={16} /> Terms of Use</span>
            <ChevronLeft size={16} className="rotate-180 text-gray-400" />
          </Link>
          <Link to="/data-safety" className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <span className="flex items-center gap-3 text-gray-700 dark:text-gray-200"><Shield size={16} /> Data Safety</span>
            <ChevronLeft size={16} className="rotate-180 text-gray-400" />
          </Link>
        </section>
        
        <div className="text-center text-xs text-gray-400">
           Version 1.2.0 | support@serenefocus.app
        </div>
      </div>
    </div>
  );
};

const LegalPage: React.FC<{ type: 'Privacy' | 'Terms' }> = ({ type }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-pastel-dark p-6">
       <Link to="/settings" className="inline-flex items-center gap-2 text-gray-500 mb-6">
         <ChevronLeft size={20} /> Back
       </Link>
       <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{type === 'Privacy' ? 'Privacy Policy' : 'Terms of Use'}</h1>
       <div className="prose dark:prose-invert text-sm text-gray-600 dark:text-gray-300 space-y-4">
         {type === 'Privacy' ? (
           <>
             <p><strong>Last updated: Oct 2023</strong></p>
             <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information.</p>
             <h3>Data Collection</h3>
             <p>We do not collect personal data. All application data (tasks, timer settings) is stored locally on your device using LocalStorage.</p>
             <h3>Advertising</h3>
             <p>We use Google AdMob to display advertisements. AdMob may collect and use your device's advertising ID to serve personalized ads. You can opt-out of personalized ads in the Settings menu.</p>
             <h3>Contact</h3>
             <p>If you have any questions about this Privacy Policy, You can contact us: support@serenefocus.app</p>
           </>
         ) : (
           <>
             <p><strong>Last updated: Oct 2023</strong></p>
             <h3>Acceptance of Terms</h3>
             <p>By downloading or using the app, these terms will automatically apply to you.</p>
             <h3>Use of the App</h3>
             <p>You agree to use the app only for lawful purposes. You are not allowed to copy, or modify the app, any part of the app, or our trademarks in any way.</p>
             <h3>Subscriptions</h3>
             <p>If you purchase the "Ad-Free" version, it is a one-time purchase processed by the Store. We do not store payment information.</p>
           </>
         )}
       </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(Storage.getSettings());
  const [tasks, setTasks] = useState<Task[]>(Storage.getTasks());
  const [stats, setStats] = useState<DailyStats[]>(Storage.getStats());

  // Apply Theme
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    Storage.saveSettings(newSettings);
  };

  // Ensure default soundscape is set if missing (for legacy data)
  useEffect(() => {
      if (settings.soundscape === undefined) {
          updateSettings({ ...settings, soundscape: DEFAULT_SETTINGS.soundscape, soundscapeVolume: DEFAULT_SETTINGS.soundscapeVolume });
      }
      if (settings.personalizedAds === undefined) {
         updateSettings({ ...settings, personalizedAds: DEFAULT_SETTINGS.personalizedAds });
      }
  }, []);

  return (
    <Router>
      <div className="min-h-screen text-gray-900 dark:text-white font-sans antialiased transition-colors duration-300">
        <Routes>
          <Route path="/" element={
            <HomePage 
              settings={settings} 
              updateSettings={updateSettings}
              tasks={tasks} 
              setTasks={setTasks} 
              stats={stats}
              setStats={setStats}
            />
          } />
          <Route path="/settings" element={
            <SettingsPage settings={settings} updateSettings={updateSettings} />
          } />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/privacy" element={<LegalPage type="Privacy" />} />
          <Route path="/terms" element={<LegalPage type="Terms" />} />
          <Route path="/data-safety" element={<DataSafetyPage />} />
        </Routes>
        
        {/* Persistent Ad Banner - Strict Placement */}
        <AdBanner isPremium={settings.isPremium} personalizedAds={settings.personalizedAds} />
      </div>
    </Router>
  );
};

export default App;