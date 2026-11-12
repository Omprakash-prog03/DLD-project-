import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatTimeDisplay, getRepeatLabel, padZero } from '../../utils/timeCalculations';
import { Plus, Trash2, Edit2, Play, BellOff, Sparkles } from 'lucide-react';

export const AlarmsColumn: React.FC = () => {
  const {
    alarms,
    timeFormat,
    openAlarmCreator,
    deleteAlarm,
    toggleAlarm,
    triggerAlarmManualTest,
  } = useAppStore();

  return (
    <section className="w-full flex flex-col space-y-6 select-none">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#D0CFC8]/40 dark:border-[#2F2F2B]">
        <div className="flex items-baseline space-x-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#85847F] dark:text-[#999890]">
            YOUR ALARMS
          </span>
          <span className="text-xs font-mono text-[#85847F] dark:text-[#999890]">
            ({alarms.filter((a) => a.enabled).length} ACTIVE / {alarms.length} TOTAL)
          </span>
        </div>

        {/* Clear + Add Alarm Action */}
        <button
          onClick={() => openAlarmCreator()}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-sm"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Add Alarm</span>
        </button>
      </div>

      {/* Alarms List or Empty State */}
      {alarms.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center border border-dashed border-[#D0CFC8] dark:border-[#2F2F2B] rounded-3xl p-8 bg-[#F2F1EC]/50 dark:bg-[#22221F]/30">
          <BellOff size={32} className="text-[#85847F] opacity-50 mb-3" />
          <h3 className="text-sm font-semibold text-[#171717] dark:text-[#F2F0E9]">
            No Alarms Configured
          </h3>
          <p className="text-xs text-[#85847F] dark:text-[#999890] mt-1 max-w-xs">
            Create your first alarm to automatically schedule independent wake-up alerts on the physical clock.
          </p>
          <button
            onClick={() => openAlarmCreator()}
            className="mt-4 px-5 py-2.5 rounded-full bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] text-xs font-semibold"
          >
            + Create First Alarm
          </button>
        </div>
      ) : (
        /* SIMPLE, ELEGANT HORIZONTAL ENTRIES SEPARATED BY SUBTLE HORIZONTAL DIVIDERS */
        <div className="divide-y divide-[#D0CFC8]/50 dark:divide-[#2F2F2B]">
          {alarms.map((alarm) => {
            const formatted = formatTimeDisplay(alarm.hour, alarm.minute, undefined, timeFormat);
            const repeatText = getRepeatLabel(alarm.repeatType, alarm.repeatDays);

            return (
              <div
                key={alarm.id}
                className={`py-4 sm:py-5 flex items-center justify-between transition-opacity group ${
                  alarm.enabled ? 'opacity-100' : 'opacity-40 hover:opacity-75'
                }`}
              >
                {/* Left: Large Time Typography & Information */}
                <div
                  className="flex items-baseline space-x-4 cursor-pointer flex-1"
                  onClick={() => openAlarmCreator(alarm)}
                >
                  <span className="text-3xl sm:text-4xl font-light tracking-tight tabular-nums text-[#171717] dark:text-[#F2F0E9]">
                    {padZero(timeFormat === '12h' ? (alarm.hour % 12 || 12) : alarm.hour)}:
                    {padZero(alarm.minute)}
                  </span>

                  {formatted.period && (
                    <span className="text-xs font-semibold text-[#85847F] uppercase tracking-wide">
                      {formatted.period}
                    </span>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-3">
                    <span className="text-sm font-medium text-[#171717] dark:text-[#F2F0E9]">
                      {alarm.title}
                    </span>
                    <span className="text-xs text-[#85847F] dark:text-[#999890]">
                      {repeatText}
                    </span>
                  </div>

                  {alarm.wakeUpMission && (
                    <span
                      className="hidden md:inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E9D82C]/20 text-[#171717] dark:text-[#E9D82C]"
                      title="Mission: Clean Field on Ring"
                    >
                      <Sparkles size={10} />
                      <span>Mission</span>
                    </span>
                  )}
                </div>

                {/* Right: Controls & Minimal Toggle */}
                <div className="flex items-center space-x-3 ml-4">
                  {/* Test Buzzer */}
                  <button
                    onClick={() => triggerAlarmManualTest(alarm.id)}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] transition-colors"
                    title="Test buzzer ring"
                  >
                    <Play size={14} />
                  </button>

                  {/* Edit Alarm */}
                  <button
                    onClick={() => openAlarmCreator(alarm)}
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] transition-colors"
                    title="Edit alarm"
                  >
                    <Edit2 size={14} />
                  </button>

                  {/* Delete Alarm */}
                  <button
                    onClick={() => deleteAlarm(alarm.id)}
                    className="p-1.5 rounded-full hover:bg-rose-500/10 text-[#85847F] hover:text-rose-600 transition-colors"
                    title="Delete alarm"
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Minimal Toggle Switch */}
                  <button
                    onClick={() => toggleAlarm(alarm.id, !alarm.enabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                      alarm.enabled
                        ? 'bg-[#171717] dark:bg-[#E9D82C]'
                        : 'bg-[#D0CFC8] dark:bg-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white dark:bg-black shadow-xs transition-transform absolute top-0.5 ${
                        alarm.enabled ? 'left-6' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
