import React from 'react';
import { Wifi, BatteryMedium, Cpu, Radio } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { padZero } from '../../utils/timeCalculations';

export const StatusBar: React.FC = () => {
  const { currentTime, operatingMode, deviceStatus } = useAppStore();

  return (
    <div className="w-full pt-3 px-6 pb-2 flex items-center justify-between text-xs font-medium text-[#171717] dark:text-[#F2F0E9] select-none z-30">
      {/* Left: Time & Mode indicator */}
      <div className="flex items-center space-x-1.5">
        <span className="font-semibold tabular-nums tracking-tight">
          {padZero(currentTime.hour)}:{padZero(currentTime.minute)}
        </span>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase transition-colors ${
            operatingMode === 'hardware'
              ? deviceStatus.connected
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20'
              : 'bg-[#171717]/10 dark:bg-white/10 text-[#85847F] dark:text-[#999890]'
          }`}
          title={operatingMode === 'hardware' ? `ESP32 Hardware (${deviceStatus.ipAddress})` : 'Simulation Mode'}
        >
          {operatingMode === 'hardware' ? 'ESP32' : 'SIM'}
        </span>
      </div>

      {/* Center: Dynamic Island / Speaker cutout */}
      <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center space-x-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#121212] border border-neutral-800" />
        <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
      </div>

      {/* Right: Hardware signals & battery */}
      <div className="flex items-center space-x-2 text-[#171717] dark:text-[#F2F0E9]">
        {operatingMode === 'hardware' && (
          <Radio
            size={12}
            className={deviceStatus.connected ? 'text-emerald-600 animate-pulse' : 'text-rose-500'}
          />
        )}
        <Wifi size={13} className={deviceStatus.connected ? 'opacity-90' : 'opacity-30'} />
        <Cpu size={12} className="opacity-70" />
        <BatteryMedium size={14} className="opacity-90" />
      </div>
    </div>
  );
};
