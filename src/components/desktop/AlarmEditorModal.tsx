import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { RepeatType, SoundType } from '../../types';
import { buzzerAudio } from '../../services/audio/buzzerAudio';
import { DAYS_OF_WEEK, getRepeatLabel, padZero } from '../../utils/timeCalculations';
import { X, Check } from 'lucide-react';

export const AlarmEditorModal: React.FC = () => {
  const { isAlarmCreatorOpen, editingAlarm, closeAlarmCreator, saveAlarm, isSyncing } = useAppStore();

  const [selectedHour, setSelectedHour] = useState<number>(editingAlarm ? editingAlarm.hour : 7);
  const [selectedMinute, setSelectedMinute] = useState<number>(editingAlarm ? editingAlarm.minute : 0);
  const [title, setTitle] = useState<string>(editingAlarm ? editingAlarm.title : 'Morning Routine');
  const [enabled, setEnabled] = useState<boolean>(editingAlarm ? editingAlarm.enabled : true);

  const [repeatType, setRepeatType] = useState<RepeatType>(editingAlarm ? editingAlarm.repeatType : 'weekdays');
  const [repeatDays, setRepeatDays] = useState<number[]>(editingAlarm ? editingAlarm.repeatDays : [1, 2, 3, 4, 5]);
  const [soundId, setSoundId] = useState<SoundType>(editingAlarm ? editingAlarm.soundId : 'buzzer-standard');
  const [snoozeDuration, setSnoozeDuration] = useState<number>(editingAlarm ? editingAlarm.snoozeDuration : 10);
  const [wakeUpMission] = useState<boolean>(editingAlarm ? editingAlarm.wakeUpMission : true);

  const [activeSheet, setActiveSheet] = useState<'sound' | 'snooze' | null>(null);

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const prevHourRef = useRef(selectedHour);
  const prevMinuteRef = useRef(selectedMinute);

  useEffect(() => {
    if (prevHourRef.current !== selectedHour) {
      buzzerAudio.playWheelTick();
      prevHourRef.current = selectedHour;
    }
  }, [selectedHour]);

  useEffect(() => {
    if (prevMinuteRef.current !== selectedMinute) {
      buzzerAudio.playWheelTick();
      prevMinuteRef.current = selectedMinute;
    }
  }, [selectedMinute]);

  const changeHour = useCallback((delta: number) => {
    setSelectedHour((prev) => (prev + delta + 24) % 24);
  }, []);

  const changeMinute = useCallback((delta: number) => {
    setSelectedMinute((prev) => (prev + delta + 60) % 60);
  }, []);

  const toggleDay = (dayId: number) => {
    setRepeatType('custom');
    if (repeatDays.includes(dayId)) {
      setRepeatDays(repeatDays.filter((d) => d !== dayId));
    } else {
      setRepeatDays([...repeatDays, dayId]);
    }
  };

  const handleSave = async () => {
    await saveAlarm({
      title: title.trim() || 'Alarm',
      hour: selectedHour,
      minute: selectedMinute,
      second: 0,
      enabled,
      repeatType,
      repeatDays,
      soundId,
      snoozeDuration,
      wakeUpMission,
      date: null,
      lastTriggeredAt: null,
    });
  };

  if (!isAlarmCreatorOpen) return null;

  const offsets = [-2, -1, 0, 1, 2];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#E8E7E1] dark:bg-[#171715] rounded-3xl p-6 sm:p-8 border border-[#D0CFC8] dark:border-[#2F2F2B] shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D0CFC8]/40 dark:border-[#2F2F2B]">
          <h2 className="text-base font-semibold text-[#171717] dark:text-[#F2F0E9] tracking-tight">
            {editingAlarm ? 'Edit Alarm' : 'New Alarm'}
          </h2>

          <button
            onClick={closeAlarmCreator}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Alarm Title Field */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-[#85847F] dark:text-[#999890] block mb-1">
            Alarm Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Morning Routine, Focus Block"
            className="w-full bg-[#F2F1EC] dark:bg-[#22221F] border border-[#D0CFC8]/60 dark:border-[#2F2F2B] rounded-2xl px-4 py-2.5 text-sm font-medium text-[#171717] dark:text-[#F2F0E9] focus:outline-none focus:border-[#171717] dark:focus:border-[#F2F0E9] transition-colors"
          />
        </div>

        {/* 2. Distinctive Mechanical Scrolling Time Picker */}
        <div className="relative w-full h-[200px] flex items-center justify-center bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#D0CFC8]/60 dark:border-[#2F2F2B] overflow-hidden">
          {/* Curved intersecting background SVG */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-60 dark:opacity-30">
            <svg className="w-full h-full" viewBox="0 0 400 200" fill="none">
              <path
                d="M 60 10 C 120 35, 140 75, 140 100 C 140 125, 120 165, 60 190"
                stroke="#D0CFC8"
                strokeWidth="1.5"
                fill="rgba(232, 231, 225, 0.4)"
              />
              <path
                d="M 340 10 C 280 35, 260 75, 260 100 C 260 125, 280 165, 340 190"
                stroke="#D0CFC8"
                strokeWidth="1.5"
                fill="rgba(232, 231, 225, 0.4)"
              />
            </svg>
          </div>

          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-14 pointer-events-none border-y border-[#D0CFC8] dark:border-[#2F2F2B] bg-[#171717]/[0.02] dark:bg-white/[0.02] rounded-lg" />

          <div className="relative z-10 w-full max-w-xs flex items-center justify-around h-full">
            {/* Hour Wheel */}
            <div
              ref={hourRef}
              tabIndex={0}
              role="spinbutton"
              aria-label="Alarm hour"
              aria-valuenow={selectedHour}
              onWheel={(e) => {
                e.preventDefault();
                if (e.deltaY > 15) changeHour(1);
                else if (e.deltaY < -15) changeHour(-1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') { e.preventDefault(); changeHour(-1); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); changeHour(1); }
              }}
              className="flex-1 h-full flex flex-col items-center justify-center cursor-ns-resize focus:outline-none focus:ring-1 focus:ring-[#E9D82C] rounded-xl"
            >
              {offsets.map((offset) => {
                const h = (selectedHour + offset + 24) % 24;
                const isCenter = offset === 0;
                const absOffset = Math.abs(offset);

                let opacity = 1;
                let scale = 'scale-100 font-light';
                let color = 'text-[#171717] dark:text-[#F2F0E9]';

                if (absOffset === 1) {
                  opacity = 0.55;
                  scale = 'scale-85 font-light';
                  color = 'text-[#85847F] dark:text-[#999890]';
                } else if (absOffset >= 2) {
                  opacity = 0.2;
                  scale = 'scale-70 font-thin';
                  color = 'text-[#D0CFC8] dark:text-[#555]';
                }

                return (
                  <div
                    key={`h-${offset}`}
                    onClick={() => changeHour(offset)}
                    style={{ opacity }}
                    className={`h-9 flex items-center justify-center transition-all duration-150 tabular-nums ${scale} ${color} ${
                      isCenter ? 'text-4xl font-light text-[#171717] dark:text-[#F2F0E9]' : 'text-2xl'
                    }`}
                  >
                    {padZero(h)}
                  </div>
                );
              })}
            </div>

            <span className="text-2xl font-light text-[#85847F]">:</span>

            {/* Minute Wheel */}
            <div
              ref={minuteRef}
              tabIndex={0}
              role="spinbutton"
              aria-label="Alarm minute"
              aria-valuenow={selectedMinute}
              onWheel={(e) => {
                e.preventDefault();
                if (e.deltaY > 15) changeMinute(1);
                else if (e.deltaY < -15) changeMinute(-1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') { e.preventDefault(); changeMinute(-1); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); changeMinute(1); }
              }}
              className="flex-1 h-full flex flex-col items-center justify-center cursor-ns-resize focus:outline-none focus:ring-1 focus:ring-[#E9D82C] rounded-xl"
            >
              {offsets.map((offset) => {
                const m = (selectedMinute + offset + 60) % 60;
                const isCenter = offset === 0;
                const absOffset = Math.abs(offset);

                let opacity = 1;
                let scale = 'scale-100 font-light';
                let color = 'text-[#171717] dark:text-[#F2F0E9]';

                if (absOffset === 1) {
                  opacity = 0.55;
                  scale = 'scale-85 font-light';
                  color = 'text-[#85847F] dark:text-[#999890]';
                } else if (absOffset >= 2) {
                  opacity = 0.2;
                  scale = 'scale-70 font-thin';
                  color = 'text-[#D0CFC8] dark:text-[#555]';
                }

                return (
                  <div
                    key={`m-${offset}`}
                    onClick={() => changeMinute(offset)}
                    style={{ opacity }}
                    className={`h-9 flex items-center justify-center transition-all duration-150 tabular-nums ${scale} ${color} ${
                      isCenter ? 'text-4xl font-light text-[#171717] dark:text-[#F2F0E9]' : 'text-2xl'
                    }`}
                  >
                    {padZero(m)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Repeat Days (Weekday pills) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#85847F] dark:text-[#999890]">
              Repeat Days
            </label>
            <span className="text-xs text-[#85847F] dark:text-[#999890]">
              {getRepeatLabel(repeatType, repeatDays)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = repeatDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#E9D82C] text-[#171717] shadow-xs'
                      : 'bg-[#F2F1EC] dark:bg-[#22221F] text-[#85847F] dark:text-[#999890] hover:bg-[#D0CFC8]/40'
                  }`}
                >
                  {day.short}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Sub-Options: Hardware Buzzer Tone & Snooze */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setActiveSheet(activeSheet === 'sound' ? null : 'sound')}
            className="flex flex-col items-start p-3 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#D0CFC8]/50 dark:border-[#2F2F2B] text-left hover:border-[#171717] transition-all"
          >
            <span className="text-[10px] font-mono uppercase text-[#85847F]">Sound</span>
            <span className="text-xs font-semibold text-[#171717] dark:text-[#F2F0E9] mt-0.5 capitalize">
              {soundId.replace('buzzer-', '')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSheet(activeSheet === 'snooze' ? null : 'snooze')}
            className="flex flex-col items-start p-3 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#D0CFC8]/50 dark:border-[#2F2F2B] text-left hover:border-[#171717] transition-all"
          >
            <span className="text-[10px] font-mono uppercase text-[#85847F]">Snooze</span>
            <span className="text-xs font-semibold text-[#171717] dark:text-[#F2F0E9] mt-0.5">
              {snoozeDuration === 0 ? 'Off' : `${snoozeDuration} minutes`}
            </span>
          </button>
        </div>

        {/* Compact selection drawer for Sound or Snooze */}
        {activeSheet === 'sound' && (
          <div className="p-3 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#D0CFC8] dark:border-[#2F2F2B] space-y-1.5 animate-in fade-in">
            <span className="text-[10px] text-[#85847F] block mb-1">
              Hardware piezo buzzer patterns (polyphonic melodies not supported by hardware):
            </span>
            {[
              { id: 'buzzer-standard', name: 'Standard 2.4 kHz Piezo' },
              { id: 'buzzer-pulsed', name: 'Pulsed High Attention' },
              { id: 'buzzer-multitone', name: 'Dual Frequency (1.8/2.6 kHz)' },
              { id: 'buzzer-gentle', name: 'Soft Triangle Tone' },
            ].map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  setSoundId(s.id as SoundType);
                  buzzerAudio.playTone(s.id as SoundType, 400);
                  setActiveSheet(null);
                }}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer ${
                  soundId === s.id ? 'bg-[#171717] text-white dark:bg-[#F2F0E9] dark:text-black' : 'hover:bg-black/5'
                }`}
              >
                <span>{s.name}</span>
                {soundId === s.id && <Check size={14} />}
              </div>
            ))}
          </div>
        )}

        {activeSheet === 'snooze' && (
          <div className="p-3 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#D0CFC8] dark:border-[#2F2F2B] space-y-1.5 animate-in fade-in">
            {[0, 5, 10, 15, 30].map((dur) => (
              <div
                key={dur}
                onClick={() => {
                  setSnoozeDuration(dur);
                  setActiveSheet(null);
                }}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer ${
                  snoozeDuration === dur ? 'bg-[#171717] text-white dark:bg-[#F2F0E9] dark:text-black' : 'hover:bg-black/5'
                }`}
              >
                <span>{dur === 0 ? 'Off (No Snooze)' : `${dur} minutes`}</span>
                {snoozeDuration === dur && <Check size={14} />}
              </div>
            ))}
          </div>
        )}

        {/* 5. Enabled State Toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-medium text-[#171717] dark:text-[#F2F0E9]">
            Enable Alarm Immediately
          </span>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              enabled ? 'bg-[#171717] dark:bg-[#E9D82C]' : 'bg-[#D0CFC8] dark:bg-neutral-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white dark:bg-black shadow-xs transition-transform absolute top-0.5 ${
                enabled ? 'left-6' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#D0CFC8]/40 dark:border-[#2F2F2B]">
          <button
            type="button"
            onClick={closeAlarmCreator}
            className="px-5 py-2.5 rounded-full text-xs font-medium text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] hover:bg-black/5 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-sm disabled:opacity-50"
          >
            <Check size={14} strokeWidth={2.5} />
            <span>{editingAlarm ? 'Update Alarm' : 'Save Alarm'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
