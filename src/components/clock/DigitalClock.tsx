import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { findNextUpcomingAlarm, formatTimeDisplay, padZero } from '../../utils/timeCalculations';
import { RefreshCw } from 'lucide-react';

export const DigitalClock: React.FC = () => {
  const {
    currentTime,
    timeFormat,
    setTimeFormat,
    alarms,
    syncWithBrowserTime,
    isSyncing,
  } = useAppStore();

  const formatted = formatTimeDisplay(
    currentTime.hour,
    currentTime.minute,
    currentTime.second,
    timeFormat
  );

  const nextUpcoming = findNextUpcomingAlarm(alarms, currentTime);

  const sourceLabels = {
    DS3231: 'DS3231 High-Precision RTC',
    ESP32_INTERNAL: 'ESP32 Software Clock',
    SIMULATED: 'Software Clock (Simulated)',
    BROWSER: 'Browser Local Clock',
  };

  return (
    <div className="w-full flex flex-col items-center justify-center pt-2 pb-1 text-center select-none">
      {/* Time Source Tag */}
      <div className="flex items-center space-x-2 mb-1">
        <span className="inline-flex items-center space-x-1 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-[#171717]/5 dark:bg-white/10 text-[#85847F] dark:text-[#999890] border border-[#C9C8C1]/30 dark:border-[#2F2F2B]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              currentTime.source === 'DS3231'
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-[#E9D82C]'
            }`}
          />
          <span>{sourceLabels[currentTime.source] || currentTime.source}</span>
        </span>

        {/* Quick Sync Button */}
        <button
          onClick={() => syncWithBrowserTime()}
          disabled={isSyncing}
          className="text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] p-1 rounded transition-colors"
          title="Synchronize time from current device"
        >
          <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Main Big Digital Clock (inspired by frame 0s / 10:30 in reference) */}
      <div className="relative inline-flex items-baseline justify-center cursor-pointer group"
        onClick={() => setTimeFormat(timeFormat === '24h' ? '12h' : '24h')}
        title="Tap to toggle 12h / 24h format"
      >
        <h1 className="text-6xl sm:text-7xl font-extralight tracking-tighter text-[#171717] dark:text-[#F2F0E9] tabular-nums font-sans leading-none">
          {padZero(timeFormat === '12h' ? (currentTime.hour % 12 || 12) : currentTime.hour)}
          <span className="inline-block animate-[pulse_1.5s_ease-in-out_infinite] opacity-80">:</span>
          {padZero(currentTime.minute)}
        </h1>

        {/* Seconds & AM/PM Tag */}
        <div className="ml-2 flex flex-col text-left">
          {formatted.period && (
            <span className="text-xs font-semibold text-[#85847F] dark:text-[#999890] uppercase tracking-wide">
              {formatted.period}
            </span>
          )}
          <span className="text-xs font-mono tabular-nums text-[#85847F] dark:text-[#999890] font-light">
            .{padZero(currentTime.second)}
          </span>
        </div>
      </div>

      {/* Next Alarm Subtext (frame 0s: "The next alarm clock is in 10 min") */}
      <div className="mt-2 flex items-center justify-center space-x-1 text-xs text-[#85847F] dark:text-[#999890]">
        {nextUpcoming ? (
          <span className="font-normal">
            The next alarm clock is <strong className="font-semibold text-[#171717] dark:text-[#F2F0E9]">{nextUpcoming.relativeStr}</strong>
            <span className="opacity-75"> ({padZero(nextUpcoming.alarm.hour)}:{padZero(nextUpcoming.alarm.minute)} • {nextUpcoming.alarm.title})</span>
          </span>
        ) : (
          <span className="text-[#85847F]/80 dark:text-[#999890]/80">No upcoming alarms scheduled</span>
        )}
      </div>

      {/* Date Display */}
      <div className="text-[11px] font-mono text-[#85847F] dark:text-[#999890] mt-0.5">
        {new Date(currentTime.year, currentTime.month - 1, currentTime.day).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </div>
    </div>
  );
};
