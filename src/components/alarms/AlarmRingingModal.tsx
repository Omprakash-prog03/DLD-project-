import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { WakeUpGame } from './WakeUpGame';
import { Bell, Moon, X, Sparkles } from 'lucide-react';
import { formatTimeDisplay, padZero } from '../../utils/timeCalculations';

export const AlarmRingingModal: React.FC = () => {
  const {
    activeRingingAlarm,
    dismissRingingAlarm,
    snoozeRingingAlarm,
    timeFormat,
    isGameActive,
    openWakeUpGame,
  } = useAppStore();

  if (!activeRingingAlarm) return null;

  // If wake-up mission is enabled and game is active
  if (isGameActive && activeRingingAlarm.wakeUpMission) {
    return (
      <div className="absolute inset-0 bg-[#E8E7E1] dark:bg-[#171715] z-50 rounded-[38px] overflow-hidden flex flex-col">
        <WakeUpGame
          onComplete={() => dismissRingingAlarm()}
          onDismiss={() => dismissRingingAlarm()}
        />
      </div>
    );
  }

  const formatted = formatTimeDisplay(
    activeRingingAlarm.hour,
    activeRingingAlarm.minute,
    undefined,
    timeFormat
  );

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 rounded-[38px] overflow-hidden flex flex-col items-center justify-between p-8 text-white select-none animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col items-center text-center mt-6">
        <div className="w-16 h-16 rounded-full bg-[#E9D82C] text-[#171717] flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(233,216,44,0.6)]">
          <Bell size={32} />
        </div>
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 mt-4">
          Hardware Alarm Triggered
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
          {activeRingingAlarm.title}
        </h2>
        {activeRingingAlarm.description && (
          <p className="text-xs text-neutral-400 mt-1">{activeRingingAlarm.description}</p>
        )}
      </div>

      {/* Big Ringing Time */}
      <div className="text-6xl font-extralight tracking-tighter tabular-nums my-auto">
        {padZero(timeFormat === '12h' ? (activeRingingAlarm.hour % 12 || 12) : activeRingingAlarm.hour)}:
        {padZero(activeRingingAlarm.minute)}
        {formatted.period && <span className="text-lg ml-2 text-neutral-400 font-normal">{formatted.period}</span>}
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-3 mb-4">
        {activeRingingAlarm.wakeUpMission && (
          <button
            onClick={() => openWakeUpGame()}
            className="w-full py-3.5 rounded-2xl bg-[#E9D82C] text-[#171717] font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg hover:scale-102 active:scale-98 transition-all"
          >
            <Sparkles size={18} />
            <span>Start "Clean Field" Mission</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => snoozeRingingAlarm(activeRingingAlarm.snoozeDuration || 10)}
            className="py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs flex items-center justify-center space-x-2 transition-colors border border-neutral-700"
          >
            <Moon size={16} />
            <span>Snooze ({activeRingingAlarm.snoozeDuration || 10}m)</span>
          </button>

          <button
            onClick={() => dismissRingingAlarm()}
            className="py-3.5 rounded-2xl bg-white text-black hover:bg-neutral-200 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-md"
          >
            <X size={16} />
            <span>Dismiss Alarm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
