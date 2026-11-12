import React from 'react';
import { useAppStore } from '../../store/useAppStore';

export const TimelineBar: React.FC = () => {
  const { currentTime, alarms } = useAppStore();

  // 24 ticks representing the 24 hours of the day
  const ticks = Array.from({ length: 25 }, (_, i) => i);
  const currentFraction = (currentTime.hour * 60 + currentTime.minute) / (24 * 60);

  // Map active alarms to their hour fraction
  const activeAlarmPositions = alarms
    .filter((a) => a.enabled)
    .map((a) => ({
      id: a.id,
      title: a.title,
      fraction: (a.hour * 60 + a.minute) / (24 * 60),
      timeStr: `${String(a.hour).padStart(2, '0')}:${String(a.minute).padStart(2, '0')}`,
    }));

  return (
    <div className="w-full my-4 px-2">
      <div className="relative h-14 flex items-center justify-between border-y border-[#C9C8C1]/40 dark:border-[#2F2F2B]/60 py-2">
        {/* Background Ticks */}
        <div className="absolute inset-x-0 h-full flex items-center justify-between px-1 pointer-events-none">
          {ticks.map((t) => {
            const isMajor = t % 6 === 0;
            const isMid = t % 3 === 0;
            return (
              <div
                key={t}
                className={`w-[1px] transition-all ${
                  isMajor
                    ? 'h-6 bg-[#171717]/60 dark:bg-[#F2F0E9]/60'
                    : isMid
                    ? 'h-4 bg-[#85847F]/40 dark:bg-[#999890]/40'
                    : 'h-2.5 bg-[#85847F]/20 dark:bg-[#999890]/20'
                }`}
              />
            );
          })}
        </div>

        {/* Current Time Needle indicator (Yellow) */}
        <div
          className="absolute top-1 bottom-1 w-0.5 bg-[#E9D82C] shadow-sm z-10 transition-all duration-1000 flex flex-col items-center pointer-events-none"
          style={{ left: `${Math.min(99, Math.max(1, currentFraction * 100))}%` }}
        >
          <div className="w-2 h-2 rounded-full bg-[#E9D82C] -mt-1 shadow-sm" />
        </div>

        {/* Scheduled Alarm Markers */}
        {activeAlarmPositions.map((pos) => (
          <div
            key={pos.id}
            className="absolute top-2 bottom-2 w-1.5 rounded-full bg-[#171717] dark:bg-[#F2F0E9] group cursor-pointer z-10"
            style={{ left: `${pos.fraction * 100}%` }}
            title={`${pos.title} at ${pos.timeStr}`}
          >
            <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap shadow-md">
              {pos.timeStr}
            </div>
          </div>
        ))}
      </div>

      {/* Axis Labels */}
      <div className="flex justify-between text-[9px] text-[#85847F] dark:text-[#999890] font-mono px-1 mt-1 select-none">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
    </div>
  );
};
