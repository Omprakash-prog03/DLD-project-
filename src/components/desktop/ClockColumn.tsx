import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatTimeDisplay, findNextUpcomingAlarm, padZero } from '../../utils/timeCalculations';
import { TimelineBar } from '../clock/TimelineBar';
import { ClockTimeEditor } from './ClockTimeEditor';
import { Sliders, RefreshCw, CheckCircle } from 'lucide-react';

export const ClockColumn: React.FC = () => {
  const {
    currentTime,
    timeFormat,
    setTimeFormat,
    alarms,
    isTimeEditorOpen,
    setIsTimeEditorOpen,
    syncWithBrowserTime,
    isSyncing,
    operatingMode,
    deviceStatus,
    lastActionMessage,
    clearActionMessage,
  } = useAppStore();

  const formatted = formatTimeDisplay(
    currentTime.hour,
    currentTime.minute,
    currentTime.second,
    timeFormat
  );

  const nextUpcoming = findNextUpcomingAlarm(alarms, currentTime);

  const dateStr = new Date(currentTime.year, currentTime.month - 1, currentTime.day).toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

  return (
    <section className="w-full flex flex-col space-y-6 select-none">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#D0CFC8]/40 dark:border-[#2F2F2B]">
        <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#85847F] dark:text-[#999890]">
          CURRENT TIME
        </span>

        {/* Time format switcher & source badge */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#F2F1EC] dark:bg-[#22221F] border border-[#D0CFC8]/60 dark:border-[#2F2F2B] rounded-lg p-0.5 text-[11px] font-mono">
            <button
              onClick={() => setTimeFormat('24h')}
              className={`px-2 py-0.5 rounded transition-all font-semibold ${
                timeFormat === '24h'
                  ? 'bg-[#171717] text-white dark:bg-[#F2F0E9] dark:text-[#171717]'
                  : 'text-[#85847F]'
              }`}
            >
              24H
            </button>
            <button
              onClick={() => setTimeFormat('12h')}
              className={`px-2 py-0.5 rounded transition-all font-semibold ${
                timeFormat === '12h'
                  ? 'bg-[#171717] text-white dark:bg-[#F2F0E9] dark:text-[#171717]'
                  : 'text-[#85847F]'
              }`}
            >
              12H
            </button>
          </div>

          <span
            className={`inline-flex items-center space-x-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border ${
              operatingMode === 'hardware'
                ? deviceStatus.connected
                  ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30'
                : 'bg-[#F2F1EC] dark:bg-[#22221F] text-[#85847F] dark:text-[#999890] border-[#D0CFC8]/50'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                operatingMode === 'hardware' && deviceStatus.connected
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-[#E9D82C]'
              }`}
            />
            <span>{currentTime.source === 'DS3231' ? 'DS3231 RTC' : 'Software Clock (Simulated)'}</span>
          </span>
        </div>
      </div>

      {/* Success Banner if action occurred */}
      {lastActionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle size={15} />
            <span>{lastActionMessage}</span>
          </div>
          <button onClick={clearActionMessage} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* OVERSIZED LIVE DIGITAL CLOCK (The Visual Centerpiece) */}
      <div className="pt-2 pb-4">
        <div className="flex items-baseline space-x-3">
          <h1 className="text-7xl sm:text-8xl xl:text-9xl font-extralight tracking-tighter text-[#171717] dark:text-[#F2F0E9] tabular-nums font-sans leading-none">
            {padZero(timeFormat === '12h' ? (currentTime.hour % 12 || 12) : currentTime.hour)}
            <span className="inline-block animate-[pulse_1.5s_ease-in-out_infinite] opacity-70">:</span>
            {padZero(currentTime.minute)}
          </h1>

          <div className="flex flex-col text-left">
            {formatted.period && (
              <span className="text-sm font-semibold text-[#85847F] uppercase tracking-wider mb-1">
                {formatted.period}
              </span>
            )}
            <span className="text-2xl xl:text-3xl font-light font-mono tabular-nums text-[#85847F] dark:text-[#999890]">
              :{padZero(currentTime.second)}
            </span>
          </div>
        </div>

        {/* Current Date Display */}
        <p className="text-base sm:text-lg font-normal text-[#85847F] dark:text-[#999890] mt-3">
          {dateStr}
        </p>

        {/* Next Scheduled Alarm Countdown */}
        <div className="mt-2 text-xs font-medium text-[#85847F] dark:text-[#999890]">
          {nextUpcoming ? (
            <span>
              The next alarm is <strong className="text-[#171717] dark:text-[#F2F0E9] font-semibold">{nextUpcoming.relativeStr}</strong> — {nextUpcoming.alarm.title} ({padZero(nextUpcoming.alarm.hour)}:{padZero(nextUpcoming.alarm.minute)})
            </span>
          ) : (
            <span>No upcoming alarms scheduled for today.</span>
          )}
        </div>
      </div>

      {/* 24-Hour Timeline Bar */}
      <div className="py-1">
        <TimelineBar />
      </div>

      {/* TIME ADJUSTMENT ACTION / INLINE TIME SETTING PANEL */}
      {!isTimeEditorOpen ? (
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={() => setIsTimeEditorOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-sm"
          >
            <Sliders size={14} />
            <span>EDIT TIME</span>
          </button>

          <button
            onClick={() => syncWithBrowserTime()}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-[#F2F1EC] dark:bg-[#22221F] border border-[#D0CFC8] dark:border-[#2F2F2B] text-xs font-medium text-[#171717] dark:text-[#F2F0E9] hover:bg-[#D0CFC8]/40 transition-colors disabled:opacity-50"
            title="Instantly synchronize with current browser clock"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>Sync Time</span>
          </button>
        </div>
      ) : (
        /* The Refined Time Editing Panel */
        <ClockTimeEditor onClose={() => setIsTimeEditorOpen(false)} />
      )}
    </section>
  );
};
