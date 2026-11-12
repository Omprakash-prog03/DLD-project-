import React from 'react';
import { Alarm, TimeFormat } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { formatTimeDisplay, getRepeatLabel, padZero } from '../../utils/timeCalculations';
import { Play, Trash2, Sparkles } from 'lucide-react';

interface AlarmCardProps {
  alarm: Alarm;
  timeFormat?: TimeFormat;
  onEdit: (alarm: Alarm) => void;
  onDelete: (id: string) => void;
}

export const AlarmCard: React.FC<AlarmCardProps> = ({
  alarm,
  timeFormat = '24h',
  onEdit,
  onDelete,
}) => {
  const { toggleAlarm, triggerAlarmManualTest } = useAppStore();
  const formatted = formatTimeDisplay(alarm.hour, alarm.minute, undefined, timeFormat);
  const repeatText = getRepeatLabel(alarm.repeatType, alarm.repeatDays);

  return (
    <div
      className={`group relative p-4 rounded-2xl transition-all border ${
        alarm.enabled
          ? 'bg-[#F2F1EC] dark:bg-[#22221F] border-[#C9C8C1]/60 dark:border-[#2F2F2B] shadow-xs'
          : 'bg-[#E8E7E1]/50 dark:bg-[#171715]/40 border-[#C9C8C1]/20 dark:border-neutral-800 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Left: Time & Information */}
        <div className="flex-1 cursor-pointer" onClick={() => onEdit(alarm)}>
          <div className="flex items-baseline space-x-1.5">
            <span
              className={`text-3xl sm:text-4xl font-light tracking-tight tabular-nums ${
                alarm.enabled
                  ? 'text-[#171717] dark:text-[#F2F0E9]'
                  : 'text-[#85847F] dark:text-[#999890]'
              }`}
            >
              {padZero(timeFormat === '12h' ? (alarm.hour % 12 || 12) : alarm.hour)}:
              {padZero(alarm.minute)}
            </span>
            {formatted.period && (
              <span className="text-xs font-medium text-[#85847F] uppercase">
                {formatted.period}
              </span>
            )}

            {alarm.wakeUpMission && (
              <span
                className="ml-2 inline-flex items-center space-x-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#E9D82C]/20 text-[#171717] dark:text-[#E9D82C] font-medium"
                title="Interactive Wake-Up Game Enabled"
              >
                <Sparkles size={10} />
                <span>Mission</span>
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center space-x-2 text-xs">
            <span className="font-semibold text-[#171717] dark:text-[#F2F0E9]">
              {alarm.title}
            </span>
            <span className="text-[#85847F] dark:text-[#999890]">•</span>
            <span className="text-[#85847F] dark:text-[#999890]">{repeatText}</span>
          </div>

          {alarm.description && (
            <p className="text-[11px] text-[#85847F] dark:text-[#999890] mt-0.5 line-clamp-1">
              {alarm.description}
            </p>
          )}
        </div>

        {/* Right: Toggle Switch & Actions */}
        <div className="flex items-center space-x-3 ml-3">
          {/* Quick test trigger */}
          <button
            onClick={() => triggerAlarmManualTest(alarm.id)}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] transition-colors"
            title="Test alarm buzzer now"
          >
            <Play size={14} />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(alarm.id)}
            className="p-1.5 rounded-full hover:bg-rose-500/10 text-[#85847F] hover:text-rose-600 transition-colors"
            title="Delete alarm"
          >
            <Trash2 size={14} />
          </button>

          {/* iOS-Style Minimal Toggle Switch */}
          <button
            onClick={() => toggleAlarm(alarm.id, !alarm.enabled)}
            className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
              alarm.enabled
                ? 'bg-[#171717] dark:bg-[#E9D82C]'
                : 'bg-[#C9C8C1] dark:bg-[#3A3A36]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white dark:bg-black shadow-sm transition-transform absolute top-0.5 ${
                alarm.enabled ? 'left-6' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
