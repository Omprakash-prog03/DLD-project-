import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AlarmCard } from './AlarmCard';
import { Plus, BellOff, Sparkles } from 'lucide-react';

export const AlarmList: React.FC = () => {
  const { alarms, timeFormat, openAlarmCreator, deleteAlarm, openWakeUpGame } = useAppStore();

  const activeAlarms = alarms.filter((a) => a.enabled);
  const disabledAlarms = alarms.filter((a) => !a.enabled);

  return (
    <div className="w-full flex flex-col space-y-4 px-1 pb-6">
      {/* Header with Quick Add & Mission Test */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-lg font-semibold text-[#171717] dark:text-[#F2F0E9] tracking-tight">
            Alarm Library
          </h2>
          <p className="text-xs text-[#85847F] dark:text-[#999890]">
            {activeAlarms.length} active of {alarms.length} configured
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Test Game Button */}
          <button
            onClick={openWakeUpGame}
            className="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-full bg-[#E9D82C]/15 text-[#171717] dark:text-[#E9D82C] hover:bg-[#E9D82C]/25 transition-colors font-medium border border-[#E9D82C]/30"
            title="Try interactive wake-up game"
          >
            <Sparkles size={13} />
            <span>Try Game</span>
          </button>

          {/* Add Alarm Button */}
          <button
            onClick={() => openAlarmCreator()}
            className="w-8 h-8 rounded-full bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all"
            title="Create new alarm"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {alarms.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-dashed border-[#C9C8C1] dark:border-[#2F2F2B] my-4">
          <BellOff size={28} className="text-[#85847F] mb-2 opacity-60" />
          <h3 className="text-sm font-semibold text-[#171717] dark:text-[#F2F0E9]">
            No Alarms Configured
          </h3>
          <p className="text-xs text-[#85847F] dark:text-[#999890] mt-1 max-w-xs">
            Create an alarm using the mechanical time picker to synchronize with your physical clock.
          </p>
          <button
            onClick={() => openAlarmCreator()}
            className="mt-4 px-4 py-2 rounded-full bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] text-xs font-medium shadow-xs hover:opacity-90 transition-opacity"
          >
            + Create First Alarm
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Alarms Section */}
          {activeAlarms.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[#85847F] dark:text-[#999890] uppercase tracking-wider px-1">
                Active Alarms ({activeAlarms.length})
              </span>
              <div className="space-y-2.5">
                {activeAlarms.map((alarm) => (
                  <AlarmCard
                    key={alarm.id}
                    alarm={alarm}
                    timeFormat={timeFormat}
                    onEdit={(a) => openAlarmCreator(a)}
                    onDelete={(id) => deleteAlarm(id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Disabled Alarms Section */}
          {disabledAlarms.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-[#85847F] dark:text-[#999890] uppercase tracking-wider px-1">
                Disabled Alarms ({disabledAlarms.length})
              </span>
              <div className="space-y-2.5">
                {disabledAlarms.map((alarm) => (
                  <AlarmCard
                    key={alarm.id}
                    alarm={alarm}
                    timeFormat={timeFormat}
                    onEdit={(a) => openAlarmCreator(a)}
                    onDelete={(id) => deleteAlarm(id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
