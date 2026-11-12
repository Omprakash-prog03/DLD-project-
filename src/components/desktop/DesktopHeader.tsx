import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Settings, Sun, Moon, RefreshCw, Volume2 } from 'lucide-react';

export const DesktopHeader: React.FC = () => {
  const {
    deviceStatus,
    operatingMode,
    isConnecting,
    isSyncing,
    setIsDeviceModalOpen,
    theme,
    setTheme,
    testBuzzer,
  } = useAppStore();

  const getStatusDisplay = () => {
    if (isConnecting || isSyncing) {
      return {
        label: 'Syncing...',
        color: 'bg-[#E9D82C]',
        textColor: 'text-[#171717] dark:text-[#E9D82C]',
        animate: 'animate-pulse',
      };
    }
    if (operatingMode === 'simulation') {
      return {
        label: 'Simulation',
        color: 'bg-neutral-400',
        textColor: 'text-[#85847F] dark:text-[#999890]',
        animate: '',
      };
    }
    if (deviceStatus.connected) {
      return {
        label: `ESP32 (${deviceStatus.ipAddress})`,
        color: 'bg-emerald-500',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        animate: 'animate-pulse',
      };
    }
    return {
      label: 'Disconnected',
      color: 'bg-rose-500',
      textColor: 'text-rose-600 dark:text-rose-400',
      animate: '',
    };
  };

  const status = getStatusDisplay();

  return (
    <header className="w-full border-b border-[#D0CFC8] dark:border-[#2F2F2B] bg-[#E8E7E1] dark:bg-[#171715] transition-colors select-none sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 h-16 flex items-center justify-between">
        {/* Left: Minimal Product Identity (TIME / CLOCK) */}
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#171717] dark:bg-[#F2F0E9]" />
          <div className="flex items-baseline space-x-2">
            <span className="text-sm font-semibold tracking-widest text-[#171717] dark:text-[#F2F0E9] font-sans">
              TIME / CLOCK
            </span>
            <span className="hidden sm:inline text-xs font-mono text-[#85847F] dark:text-[#999890] tracking-wider">
              • ESP32 SMART SYSTEM
            </span>
          </div>
        </div>

        {/* Right: Device Status Pill & Minimal Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Hardware Buzzer Quick Test */}
          <button
            onClick={() => testBuzzer('buzzer-standard')}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#F2F1EC] dark:bg-[#22221F] border border-[#D0CFC8] dark:border-[#2F2F2B] text-xs font-medium text-[#171717] dark:text-[#F2F0E9] hover:bg-[#D0CFC8]/40 transition-colors"
            title="Test hardware piezo buzzer"
          >
            <Volume2 size={13} className="text-[#85847F]" />
            <span className="text-[11px]">Buzzer</span>
          </button>

          {/* Connection Status Button (Opens Device Modal) */}
          <button
            onClick={() => setIsDeviceModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#F2F1EC] dark:bg-[#22221F] border border-[#D0CFC8] dark:border-[#2F2F2B] hover:border-[#171717] dark:hover:border-[#F2F0E9] transition-all group cursor-pointer"
            title="Open device connectivity and settings"
          >
            <span className={`w-2 h-2 rounded-full ${status.color} ${status.animate}`} />
            <span className={`text-xs font-mono font-medium ${status.textColor}`}>
              {status.label}
            </span>
            {(isConnecting || isSyncing) && (
              <RefreshCw size={11} className="animate-spin text-[#85847F]" />
            )}
          </button>

          {/* Settings Icon */}
          <button
            onClick={() => setIsDeviceModalOpen(true)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] transition-colors"
            title="Device & System Settings"
          >
            <Settings size={17} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] transition-colors"
            title="Toggle Light / Dark mode"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
};
