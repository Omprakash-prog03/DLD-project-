import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, Moon, Repeat, Check, X } from 'lucide-react';
import { RepeatType, SoundType } from '../../types';
import { buzzerAudio } from '../../services/audio/buzzerAudio';
import { DAYS_OF_WEEK, getRepeatLabel, padZero } from '../../utils/timeCalculations';

interface MechanicalTimePickerProps {
  initialHour?: number;
  initialMinute?: number;
  initialRepeatType?: RepeatType;
  initialRepeatDays?: number[];
  initialSoundId?: SoundType;
  initialSnooze?: number;
  initialMission?: boolean;
  initialTitle?: string;
  onSave: (data: {
    hour: number;
    minute: number;
    repeatType: RepeatType;
    repeatDays: number[];
    soundId: SoundType;
    snoozeDuration: number;
    wakeUpMission: boolean;
    title: string;
  }) => void;
  onCancel: () => void;
}

export const MechanicalTimePicker: React.FC<MechanicalTimePickerProps> = ({
  initialHour = 9,
  initialMinute = 50,
  initialRepeatType = 'weekdays',
  initialRepeatDays = [1, 2, 3, 4, 5],
  initialSoundId = 'buzzer-standard',
  initialSnooze = 10,
  initialMission = true,
  initialTitle = 'Morning Alarm',
  onSave,
  onCancel,
}) => {
  const [selectedHour, setSelectedHour] = useState<number>(initialHour);
  const [selectedMinute, setSelectedMinute] = useState<number>(initialMinute);
  const [title, setTitle] = useState<string>(initialTitle);

  // Configuration options
  const [repeatType, setRepeatType] = useState<RepeatType>(initialRepeatType);
  const [repeatDays, setRepeatDays] = useState<number[]>(initialRepeatDays);
  const [soundId, setSoundId] = useState<SoundType>(initialSoundId);
  const [snoozeDuration, setSnoozeDuration] = useState<number>(initialSnooze);
  const [wakeUpMission, setWakeUpMission] = useState<boolean>(initialMission);

  // Modals for the 3 sub-controls (Sound, Snooze, Repeat)
  const [activeSheet, setActiveSheet] = useState<'sound' | 'snooze' | 'repeat' | null>(null);

  // Drag states for wheels
  const hourContainerRef = useRef<HTMLDivElement>(null);
  const minuteContainerRef = useRef<HTMLDivElement>(null);

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

  // Adjust hour with wrap-around
  const changeHour = useCallback((delta: number) => {
    setSelectedHour((prev) => (prev + delta + 24) % 24);
  }, []);

  // Adjust minute with wrap-around
  const changeMinute = useCallback((delta: number) => {
    setSelectedMinute((prev) => (prev + delta + 60) % 60);
  }, []);

  // Handle Wheel Scrolling
  const handleHourWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 15) changeHour(1);
    else if (e.deltaY < -15) changeHour(-1);
  };

  const handleMinuteWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 15) changeMinute(1);
    else if (e.deltaY < -15) changeMinute(-1);
  };

  // Touch / Drag handling
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleHourTouchMove = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.touches[0].clientY;
    if (Math.abs(diff) > 28) {
      changeHour(diff > 0 ? 1 : -1);
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleMinuteTouchMove = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.touches[0].clientY;
    if (Math.abs(diff) > 24) {
      changeMinute(diff > 0 ? 1 : -1);
      touchStartY.current = e.touches[0].clientY;
    }
  };

  // Toggle single day
  const toggleDay = (dayId: number) => {
    setRepeatType('custom');
    if (repeatDays.includes(dayId)) {
      setRepeatDays(repeatDays.filter((d) => d !== dayId));
    } else {
      setRepeatDays([...repeatDays, dayId]);
    }
  };

  // Render visible number slots (-3 to +3)
  const hourOffsets = [-3, -2, -1, 0, 1, 2, 3];
  const minuteOffsets = [-3, -2, -1, 0, 1, 2, 3];

  const handleConfirm = () => {
    onSave({
      hour: selectedHour,
      minute: selectedMinute,
      repeatType,
      repeatDays,
      soundId,
      snoozeDuration,
      wakeUpMission,
      title: title.trim() || 'Alarm',
    });
  };

  return (
    <div className="w-full flex flex-col h-full justify-between select-none px-4 pt-1 pb-4 animate-in fade-in duration-200">
      {/* Alarm Title input */}
      <div className="mb-2 px-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Alarm Title (e.g. Morning Routine)"
          className="w-full bg-transparent border-b border-[#C9C8C1]/50 dark:border-[#2F2F2B] py-1 text-center font-medium text-sm text-[#171717] dark:text-[#F2F0E9] focus:outline-none focus:border-[#171717] dark:focus:border-[#F2F0E9] transition-colors placeholder:text-[#85847F]"
        />
      </div>

      {/* THE SIGNATURE CURVED WHEEL CONTAINER (Frames 2-5 in reference) */}
      <div className="relative w-full h-[280px] my-auto flex items-center justify-center overflow-hidden">
        {/* Curved intersecting background SVGs creating the signature double-lens / hourglass silhouette */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-70 dark:opacity-40">
          <svg
            className="w-full h-full"
            viewBox="0 0 360 280"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left curved arc for hours */}
            <path
              d="M 50 10 C 130 50, 170 110, 175 140 C 170 170, 130 230, 50 270"
              stroke="#C9C8C1"
              strokeWidth="1.5"
              fill="rgba(242, 241, 236, 0.45)"
            />
            {/* Right curved arc for minutes */}
            <path
              d="M 310 10 C 230 50, 190 110, 185 140 C 190 170, 230 230, 310 270"
              stroke="#C9C8C1"
              strokeWidth="1.5"
              fill="rgba(242, 241, 236, 0.45)"
            />
          </svg>
        </div>

        {/* Center horizontal selection bar highlight */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-16 pointer-events-none border-y border-[#C9C8C1]/30 dark:border-[#2F2F2B] bg-[#171717]/[0.02] dark:bg-white/[0.02]" />

        {/* TWO WHEELS: HOURS & MINUTES */}
        <div className="relative z-10 w-full flex items-center justify-around h-full">
          {/* HOUR WHEEL */}
          <div
            ref={hourContainerRef}
            onWheel={handleHourWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleHourTouchMove}
            className="flex-1 h-full flex flex-col items-center justify-center cursor-ns-resize"
          >
            {hourOffsets.map((offset) => {
              const h = (selectedHour + offset + 24) % 24;
              const isCenter = offset === 0;
              const absOffset = Math.abs(offset);

              // Styling according to offset distance
              let opacity = 1;
              let scale = 'scale-100 font-light';
              let color = 'text-[#171717] dark:text-[#F2F0E9]';

              if (absOffset === 1) {
                opacity = 0.55;
                scale = 'scale-90 font-light';
                color = 'text-[#85847F] dark:text-[#999890]';
              } else if (absOffset === 2) {
                opacity = 0.3;
                scale = 'scale-75 font-thin';
                color = 'text-[#85847F] dark:text-[#999890]';
              } else if (absOffset >= 3) {
                opacity = 0.12;
                scale = 'scale-65 font-thin';
                color = 'text-[#C9C8C1] dark:text-[#555]';
              }

              return (
                <div
                  key={`h-${offset}`}
                  onClick={() => changeHour(offset)}
                  style={{ opacity }}
                  className={`h-10 flex items-center justify-center transition-all duration-150 tabular-nums ${scale} ${color} ${
                    isCenter ? 'text-5xl font-light text-[#171717] dark:text-[#F2F0E9]' : 'text-3xl'
                  }`}
                >
                  {padZero(h)}
                </div>
              );
            })}
          </div>

          {/* MINUTE WHEEL */}
          <div
            ref={minuteContainerRef}
            onWheel={handleMinuteWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleMinuteTouchMove}
            className="flex-1 h-full flex flex-col items-center justify-center cursor-ns-resize"
          >
            {minuteOffsets.map((offset) => {
              const m = (selectedMinute + offset + 60) % 60;
              const isCenter = offset === 0;
              const absOffset = Math.abs(offset);

              let opacity = 1;
              let scale = 'scale-100 font-light';
              let color = 'text-[#171717] dark:text-[#F2F0E9]';

              if (absOffset === 1) {
                opacity = 0.55;
                scale = 'scale-90 font-light';
                color = 'text-[#85847F] dark:text-[#999890]';
              } else if (absOffset === 2) {
                opacity = 0.3;
                scale = 'scale-75 font-thin';
                color = 'text-[#85847F] dark:text-[#999890]';
              } else if (absOffset >= 3) {
                opacity = 0.12;
                scale = 'scale-65 font-thin';
                color = 'text-[#C9C8C1] dark:text-[#555]';
              }

              return (
                <div
                  key={`m-${offset}`}
                  onClick={() => changeMinute(offset)}
                  style={{ opacity }}
                  className={`h-10 flex items-center justify-center transition-all duration-150 tabular-nums ${scale} ${color} ${
                    isCenter ? 'text-5xl font-light text-[#171717] dark:text-[#F2F0E9]' : 'text-3xl'
                  }`}
                >
                  {padZero(m)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* HORIZONTAL WEEKDAY SELECTOR ROW (from Frame 0s/1s) */}
      <div className="w-full flex items-center justify-between px-2 py-2 mb-2">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = repeatDays.includes(day.id);
          return (
            <button
              key={day.id}
              onClick={() => toggleDay(day.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-[#E9D82C] text-[#171717] font-semibold shadow-xs'
                  : 'bg-transparent text-[#85847F] dark:text-[#999890] hover:bg-[#171717]/5 dark:hover:bg-white/5'
              }`}
            >
              {day.short}
            </button>
          );
        })}
      </div>

      {/* THREE MINIMAL CONFIG CONTROLS: Sound, Snooze, Repeat (from Frames 2-5) */}
      <div className="w-full grid grid-cols-3 gap-2 px-1 mb-4 text-center border-t border-[#C9C8C1]/30 dark:border-[#2F2F2B] pt-3">
        {/* Sound Button */}
        <button
          onClick={() => setActiveSheet('sound')}
          className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-[#171717]/5 dark:hover:bg-white/5 transition-colors group"
        >
          <Volume2 size={16} className="text-[#85847F] group-hover:text-[#171717] dark:group-hover:text-[#F2F0E9] mb-1" />
          <span className="text-[10px] text-[#85847F] dark:text-[#999890] font-normal uppercase tracking-wider">Sound</span>
          <span className="text-xs font-medium text-[#171717] dark:text-[#F2F0E9] truncate max-w-full">
            {soundId.replace('buzzer-', '')}
          </span>
        </button>

        {/* Snooze Button */}
        <button
          onClick={() => setActiveSheet('snooze')}
          className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-[#171717]/5 dark:hover:bg-white/5 transition-colors group"
        >
          <Moon size={16} className="text-[#85847F] group-hover:text-[#171717] dark:group-hover:text-[#F2F0E9] mb-1" />
          <span className="text-[10px] text-[#85847F] dark:text-[#999890] font-normal uppercase tracking-wider">Snooze</span>
          <span className="text-xs font-medium text-[#171717] dark:text-[#F2F0E9]">
            {snoozeDuration === 0 ? 'Off' : `${snoozeDuration} min`}
          </span>
        </button>

        {/* Repeat Button */}
        <button
          onClick={() => setActiveSheet('repeat')}
          className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-[#171717]/5 dark:hover:bg-white/5 transition-colors group"
        >
          <Repeat size={16} className="text-[#85847F] group-hover:text-[#171717] dark:group-hover:text-[#F2F0E9] mb-1" />
          <span className="text-[10px] text-[#85847F] dark:text-[#999890] font-normal uppercase tracking-wider">Repeat</span>
          <span className="text-xs font-medium text-[#171717] dark:text-[#F2F0E9] truncate max-w-full">
            {getRepeatLabel(repeatType, repeatDays)}
          </span>
        </button>
      </div>

      {/* Wake-up Mission Toggle (Clean Entire Field game) */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-[#F2F1EC] dark:bg-[#22221F] rounded-xl border border-[#C9C8C1]/30 dark:border-[#2F2F2B] mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-[#E9D82C]" />
          <span className="text-xs font-medium text-[#171717] dark:text-[#F2F0E9]">
            Wake-Up Mission: "Clean Field"
          </span>
        </div>
        <button
          onClick={() => setWakeUpMission(!wakeUpMission)}
          className={`w-10 h-5 rounded-full transition-colors relative ${
            wakeUpMission ? 'bg-[#171717] dark:bg-[#E9D82C]' : 'bg-[#C9C8C1] dark:bg-[#444]'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white dark:bg-black transition-transform absolute top-0.5 ${
              wakeUpMission ? 'left-5' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* BOTTOM ACTION ROW (from Frames 2-5): Cancel '✕' | 'Choose time' | Black circle '✓' */}
      <div className="w-full flex items-center justify-between px-4 pt-2">
        <button
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] transition-colors"
          title="Cancel"
        >
          <X size={20} />
        </button>

        <span className="text-xs text-[#85847F] dark:text-[#999890] font-normal tracking-wide">
          Choose time
        </span>

        <button
          onClick={handleConfirm}
          className="w-12 h-12 rounded-full bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] flex items-center justify-center hover:scale-105 active:scale-95 shadow-md transition-all"
          title="Save Alarm"
        >
          <Check size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* BOTTOM SHEETS FOR SOUND, SNOOZE, REPEAT */}
      {activeSheet && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end justify-center rounded-[38px] overflow-hidden">
          <div className="w-full bg-[#E8E7E1] dark:bg-[#22221F] rounded-t-3xl p-5 shadow-2xl border-t border-[#C9C8C1]/60 dark:border-[#2F2F2B] animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#C9C8C1]/30 dark:border-[#2F2F2B]">
              <h3 className="text-sm font-semibold text-[#171717] dark:text-[#F2F0E9] capitalize">
                {activeSheet === 'sound' ? 'Select Alarm Buzzer Sound' : activeSheet === 'snooze' ? 'Snooze Duration' : 'Repeat Frequency'}
              </h3>
              <button onClick={() => setActiveSheet(null)} className="p-1 text-[#85847F]">
                <X size={16} />
              </button>
            </div>

            {/* Sound options */}
            {activeSheet === 'sound' && (
              <div className="space-y-1.5 py-3">
                {[
                  { id: 'buzzer-standard', name: 'Standard Piezo (2.4 kHz)' },
                  { id: 'buzzer-pulsed', name: 'Pulsed Burst (High Attention)' },
                  { id: 'buzzer-multitone', name: 'Dual Frequency (1.8 kHz / 2.6 kHz)' },
                  { id: 'buzzer-fast', name: 'Fast Rapid Pulse' },
                  { id: 'buzzer-gentle', name: 'Soft Triangle Tone' },
                ].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSoundId(s.id as SoundType);
                      buzzerAudio.playTone(s.id as SoundType, 500);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-medium transition-colors ${
                      soundId === s.id
                        ? 'bg-[#171717] text-white dark:bg-[#F2F0E9] dark:text-[#171717]'
                        : 'bg-[#F2F1EC] dark:bg-[#171715] text-[#171717] dark:text-[#F2F0E9]'
                    }`}
                  >
                    <span>{s.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        buzzerAudio.playTone(s.id as SoundType, 600);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-black/10 dark:bg-white/10"
                    >
                      Test
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Snooze options */}
            {activeSheet === 'snooze' && (
              <div className="space-y-1.5 py-3">
                {[
                  { val: 0, label: 'Off (No Snooze)' },
                  { val: 5, label: '5 minutes' },
                  { val: 10, label: '10 minutes (Default)' },
                  { val: 15, label: '15 minutes' },
                  { val: 30, label: '30 minutes' },
                ].map((item) => (
                  <div
                    key={item.val}
                    onClick={() => {
                      setSnoozeDuration(item.val);
                      setActiveSheet(null);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-medium transition-colors ${
                      snoozeDuration === item.val
                        ? 'bg-[#171717] text-white dark:bg-[#F2F0E9] dark:text-[#171717]'
                        : 'bg-[#F2F1EC] dark:bg-[#171715] text-[#171717] dark:text-[#F2F0E9]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {snoozeDuration === item.val && <Check size={14} />}
                  </div>
                ))}
              </div>
            )}

            {/* Repeat options */}
            {activeSheet === 'repeat' && (
              <div className="space-y-1.5 py-3">
                {[
                  { type: 'once' as RepeatType, label: 'Once' },
                  { type: 'daily' as RepeatType, label: 'Every day' },
                  { type: 'weekdays' as RepeatType, label: 'Weekdays (Mon – Fri)' },
                  { type: 'weekends' as RepeatType, label: 'Weekends (Sat – Sun)' },
                  { type: 'custom' as RepeatType, label: 'Custom Days' },
                ].map((item) => (
                  <div
                    key={item.type}
                    onClick={() => {
                      setRepeatType(item.type);
                      if (item.type === 'daily') setRepeatDays([0, 1, 2, 3, 4, 5, 6]);
                      if (item.type === 'weekdays') setRepeatDays([1, 2, 3, 4, 5]);
                      if (item.type === 'weekends') setRepeatDays([6, 0]);
                      setActiveSheet(null);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-medium transition-colors ${
                      repeatType === item.type
                        ? 'bg-[#171717] text-white dark:bg-[#F2F0E9] dark:text-[#171717]'
                        : 'bg-[#F2F1EC] dark:bg-[#171715] text-[#171717] dark:text-[#F2F0E9]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {repeatType === item.type && <Check size={14} />}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setActiveSheet(null)}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#C9C8C1]/40 dark:bg-[#2F2F2B] text-[#171717] dark:text-[#F2F0E9] font-medium text-xs text-center"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
