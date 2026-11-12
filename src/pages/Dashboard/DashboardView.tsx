import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DigitalClock } from '../../components/clock/DigitalClock';
import { TimelineBar } from '../../components/clock/TimelineBar';
import { DAYS_OF_WEEK } from '../../utils/timeCalculations';
import { AlarmCard } from '../../components/alarms/AlarmCard';
import { Cpu, RefreshCw, ChevronRight } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    alarms,
    currentTime,
    openAlarmCreator,
    deleteAlarm,
    timeFormat,
    operatingMode,
    deviceStatus,
    syncWithBrowserTime,
    isSyncing,
    setActiveTab,
  } = useAppStore();

  const currentDayOfWeek = new Date(
    currentTime.year,
    currentTime.month - 1,
    currentTime.day
  ).getDay();

  const activeAlarms = alarms.filter((a) => a.enabled);

  return (
    <div className="w-full flex flex-col space-y-3 px-1 pb-6">
      {/* Top Header inside Phone view */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-1.5">
          <h2 className="text-xl font-bold tracking-tight text-[#171717] dark:text-[#F2F0E9]">
            Alarm
          </h2>
          <span className="text-xs text-[#85847F] font-mono mt-0.5">
            {operatingMode === 'hardware' ? 'ESP32' : 'Simulated'}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-2">
          {/* Quick Connection badge */}
          <button
            onClick={() => setActiveTab('device')}
            className={`flex items-center space-x-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border transition-colors ${
              operatingMode === 'hardware'
                ? deviceStatus.connected
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                : 'bg-black/5 dark:bg-white/10 text-[#85847F] dark:text-[#999890] border-transparent'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                deviceStatus.connected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span>{operatingMode === 'hardware' ? deviceStatus.ipAddress : 'Simulation'}</span>
          </button>
        </div>
      </div>

      {/* 1. Large Digital Clock */}
      <DigitalClock />

      {/* 2. Interactive Timeline Bar (Frame 0s) */}
      <TimelineBar />

      {/* 3. Horizontal Weekday Row with today highlighted (Frame 0s) */}
      <div className="w-full flex items-center justify-between px-1 py-1">
        {DAYS_OF_WEEK.map((day) => {
          const isToday = day.id === currentDayOfWeek;
          // Count active alarms for this day
          const alarmsOnThisDay = alarms.filter((a) => {
            if (!a.enabled) return false;
            if (a.repeatType === 'daily') return true;
            if (a.repeatType === 'weekdays') return [1, 2, 3, 4, 5].includes(day.id);
            if (a.repeatType === 'weekends') return [0, 6].includes(day.id);
            if (a.repeatType === 'custom') return a.repeatDays.includes(day.id);
            return false;
          }).length;

          return (
            <div
              key={day.id}
              className={`flex flex-col items-center justify-center transition-all ${
                isToday ? 'scale-105' : 'opacity-70'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex flex-col items-center justify-center text-xs font-semibold relative transition-colors ${
                  isToday
                    ? 'bg-[#E9D82C] text-[#171717] shadow-sm'
                    : 'bg-[#F2F1EC] dark:bg-[#22221F] text-[#85847F] dark:text-[#999890]'
                }`}
              >
                <span>{day.short}</span>
                {alarmsOnThisDay > 0 && (
                  <span className="text-[8px] leading-none -mt-0.5 opacity-90">
                    {alarmsOnThisDay}a
                  </span>
                )}
              </div>
              <span className="text-[8px] font-mono text-[#85847F] dark:text-[#999890] mt-1">
                {isToday ? 'TODAY' : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* 4. Active Alarms / Featured Alarm Card (Frame 0s: "09:50", play icon, 1 badge, 2 days) */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold text-[#85847F] dark:text-[#999890] uppercase tracking-wider">
            Active Alarms ({activeAlarms.length})
          </span>
          <button
            onClick={() => setActiveTab('alarms')}
            className="text-xs font-medium text-[#171717] dark:text-[#F2F0E9] hover:underline flex items-center space-x-0.5"
          >
            <span>View All</span>
            <ChevronRight size={13} />
          </button>
        </div>

        {activeAlarms.length > 0 ? (
          <div className="space-y-2">
            {activeAlarms.slice(0, 2).map((alarm) => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                timeFormat={timeFormat}
                onEdit={(a) => openAlarmCreator(a)}
                onDelete={(id) => deleteAlarm(id)}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl text-center border border-[#C9C8C1]/40 dark:border-[#2F2F2B]">
            <p className="text-xs text-[#85847F] dark:text-[#999890]">
              No active alarms ringing today.
            </p>
            <button
              onClick={() => openAlarmCreator()}
              className="mt-2 text-xs font-semibold text-[#171717] dark:text-[#F2F0E9] underline"
            >
              Set New Alarm +
            </button>
          </div>
        )}
      </div>

      {/* 5. Hardware Status Card Banner */}
      <div className="p-3 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/40 dark:border-[#2F2F2B] flex items-center justify-between text-xs mt-2">
        <div className="flex items-center space-x-2">
          <Cpu size={15} className="text-[#85847F]" />
          <div>
            <div className="font-semibold text-[#171717] dark:text-[#F2F0E9]">
              {operatingMode === 'hardware' ? 'ESP32 Hardware Sync' : 'Simulated Hardware Engine'}
            </div>
            <div className="text-[10px] text-[#85847F] dark:text-[#999890]">
              RTC: {deviceStatus.rtcAvailable ? 'DS3231 OK' : 'Unavailable'} • Buzzer: OK
            </div>
          </div>
        </div>

        <button
          onClick={() => syncWithBrowserTime()}
          disabled={isSyncing}
          className="px-2.5 py-1.5 rounded-xl bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] text-[11px] font-semibold flex items-center space-x-1"
        >
          <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
          <span>Sync</span>
        </button>
      </div>
    </div>
  );
};
