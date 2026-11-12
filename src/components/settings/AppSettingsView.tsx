import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Moon, Sun, Smartphone, Monitor, Trash2, Cpu } from 'lucide-react';

export const AppSettingsView: React.FC = () => {
  const {
    theme,
    setTheme,
    desktopViewMode,
    setDesktopViewMode,
  } = useAppStore();

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all locally saved alarms and configurations?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4 px-1 pb-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[#171717] dark:text-[#F2F0E9] tracking-tight">
          Application Settings
        </h2>
        <p className="text-xs text-[#85847F] dark:text-[#999890]">
          Appearance, layout, and storage preferences
        </p>
      </div>

      {/* Theme Preference */}
      <div className="p-4 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/50 dark:border-[#2F2F2B] space-y-3">
        <span className="text-xs font-semibold text-[#171717] dark:text-[#F2F0E9]">
          Color Appearance
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-medium transition-colors ${
              theme === 'light'
                ? 'bg-[#171717] text-white border-transparent'
                : 'bg-[#E8E7E1] dark:bg-[#171715] text-[#171717] dark:text-[#F2F0E9] border-[#C9C8C1]/40'
            }`}
          >
            <Sun size={15} />
            <span>Warm Light (#E8E7E1)</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-[#E9D82C] text-[#171717] border-transparent font-semibold'
                : 'bg-[#E8E7E1] dark:bg-[#171715] text-[#171717] dark:text-[#F2F0E9] border-[#C9C8C1]/40'
            }`}
          >
            <Moon size={15} />
            <span>Industrial Dark</span>
          </button>
        </div>
      </div>

      {/* Desktop Layout Mode */}
      <div className="p-4 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/50 dark:border-[#2F2F2B] space-y-3">
        <span className="text-xs font-semibold text-[#171717] dark:text-[#F2F0E9]">
          Desktop View Presentation
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setDesktopViewMode('editorial-frame')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors ${
              desktopViewMode === 'editorial-frame'
                ? 'bg-[#171717] text-white border-transparent'
                : 'bg-[#E8E7E1] dark:bg-[#171715] text-[#171717] dark:text-[#F2F0E9] border-[#C9C8C1]/40'
            }`}
          >
            <Smartphone size={16} />
            <span>Editorial Studio Mockup</span>
          </button>

          <button
            onClick={() => setDesktopViewMode('responsive')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors ${
              desktopViewMode === 'responsive'
                ? 'bg-[#171717] text-white border-transparent'
                : 'bg-[#E8E7E1] dark:bg-[#171715] text-[#171717] dark:text-[#F2F0E9] border-[#C9C8C1]/40'
            }`}
          >
            <Monitor size={16} />
            <span>Full Responsive View</span>
          </button>
        </div>
      </div>

      {/* Hardware Architecture Spec */}
      <div className="p-4 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/50 dark:border-[#2F2F2B] space-y-2 text-xs">
        <div className="flex items-center space-x-1.5 font-semibold text-[#171717] dark:text-[#F2F0E9]">
          <Cpu size={14} className="text-[#E9D82C]" />
          <span>Electronics Bill of Materials & Pinout</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#85847F] dark:text-[#999890] font-mono pt-1">
          <div>ESP32: WROOM-32 DevKit</div>
          <div>RTC: DS3231 I2C (21 SDA, 22 SCL)</div>
          <div>Counters: CD4518 Dual BCD</div>
          <div>Displays: 6x Common-Cathode 7-Seg</div>
          <div>Timer: NE555 1Hz Astable</div>
          <div>Buzzer: GPIO 25 (Transistor Driver)</div>
        </div>
      </div>

      {/* Reset Data */}
      <div className="pt-2">
        <button
          onClick={handleClearData}
          className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-medium flex items-center justify-center space-x-2 transition-colors"
        >
          <Trash2 size={14} />
          <span>Reset Local Database & Cache</span>
        </button>
      </div>
    </div>
  );
};
