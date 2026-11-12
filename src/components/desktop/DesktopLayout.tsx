import React from 'react';
import { DesktopHeader } from './DesktopHeader';
import { ClockColumn } from './ClockColumn';
import { AlarmsColumn } from './AlarmsColumn';
import { DeviceModal } from './DeviceModal';
import { AlarmEditorModal } from './AlarmEditorModal';
import { AlarmRingingModal } from '../alarms/AlarmRingingModal';
import { useAppStore } from '../../store/useAppStore';

export const DesktopLayout: React.FC = () => {
  const { operatingMode } = useAppStore();

  return (
    <div className="min-h-screen w-full bg-[#E8E7E1] dark:bg-[#171715] text-[#171717] dark:text-[#F2F0E9] flex flex-col justify-between selection:bg-[#E9D82C] selection:text-black transition-colors duration-300">
      {/* Horizontal Minimal Header */}
      <DesktopHeader />

      {/* Main Desktop Composition (1440 × 900 Target Viewport) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-12 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Clock (Grid cols 6 on lg) */}
          <div className="lg:col-span-6 w-full">
            <ClockColumn />
          </div>

          {/* Right Column: Alarms (Grid cols 6 on lg) */}
          <div className="lg:col-span-6 w-full">
            <AlarmsColumn />
          </div>
        </div>
      </main>

      {/* Modals & Overlays */}
      <DeviceModal />
      <AlarmEditorModal />
      <AlarmRingingModal />

      {/* Minimal Footer */}
      <footer className="w-full border-t border-[#D0CFC8]/40 dark:border-[#2F2F2B] bg-[#E8E7E1]/50 dark:bg-[#171715]/50 px-6 sm:px-12 py-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#85847F] dark:text-[#999890] select-none">
        <div>
          <span>ESP32 SMART ALARM</span> • <span className="uppercase">MODE: {operatingMode}</span>
        </div>

        <div className="mt-2 sm:mt-0 flex items-center space-x-4">
          <span>DS3231 RTC @ 0x68</span>
          <span>•</span>
          <span>CD4518 BCD Logic</span>
          <span>•</span>
          <span>Timezone: Asia/Kolkata</span>
        </div>
      </footer>
    </div>
  );
};
