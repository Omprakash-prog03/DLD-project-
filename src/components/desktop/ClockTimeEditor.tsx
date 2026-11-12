import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { buzzerAudio } from '../../services/audio/buzzerAudio';
import { padZero } from '../../utils/timeCalculations';
import { Check, RefreshCw } from 'lucide-react';

interface ClockTimeEditorProps {
  onClose: () => void;
}

export const ClockTimeEditor: React.FC<ClockTimeEditorProps> = ({ onClose }) => {
  const { currentTime, setDeviceTime, syncWithBrowserTime, isSyncing } = useAppStore();

  const [selectedHour, setSelectedHour] = useState<number>(currentTime.hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(currentTime.minute);
  const [selectedSecond, setSelectedSecond] = useState<number>(currentTime.second);

  const hourContainerRef = useRef<HTMLDivElement>(null);
  const minuteContainerRef = useRef<HTMLDivElement>(null);
  const secondContainerRef = useRef<HTMLDivElement>(null);

  const prevHourRef = useRef(selectedHour);
  const prevMinuteRef = useRef(selectedMinute);
  const prevSecondRef = useRef(selectedSecond);

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

  useEffect(() => {
    if (prevSecondRef.current !== selectedSecond) {
      buzzerAudio.playWheelTick();
      prevSecondRef.current = selectedSecond;
    }
  }, [selectedSecond]);

  const changeHour = useCallback((delta: number) => {
    setSelectedHour((prev) => (prev + delta + 24) % 24);
  }, []);

  const changeMinute = useCallback((delta: number) => {
    setSelectedMinute((prev) => (prev + delta + 60) % 60);
  }, []);

  const changeSecond = useCallback((delta: number) => {
    setSelectedSecond((prev) => (prev + delta + 60) % 60);
  }, []);

  // Wheel event handlers
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

  const handleSecondWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 15) changeSecond(1);
    else if (e.deltaY < -15) changeSecond(-1);
  };

  // Touch drag handling
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleHourTouchMove = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.touches[0].clientY;
    if (Math.abs(diff) > 24) {
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

  const handleSecondTouchMove = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.touches[0].clientY;
    if (Math.abs(diff) > 24) {
      changeSecond(diff > 0 ? 1 : -1);
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleSave = async () => {
    const ok = await setDeviceTime({
      hour: selectedHour,
      minute: selectedMinute,
      second: selectedSecond,
      day: currentTime.day,
      month: currentTime.month,
      year: currentTime.year,
    });
    if (ok) {
      buzzerAudio.playConfirm();
      onClose();
    }
  };

  const offsets = [-2, -1, 0, 1, 2];

  return (
    <div className="w-full bg-[#F2F1EC] dark:bg-[#22221F] rounded-3xl p-6 border border-[#D0CFC8] dark:border-[#2F2F2B] shadow-sm select-none animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-[#D0CFC8]/40 dark:border-[#2F2F2B]">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-[#171717] dark:text-[#F2F0E9]">
            Adjust Clock Time
          </h3>
          <p className="text-xs text-[#85847F] dark:text-[#999890]">
            Scroll numbers or use arrow keys to configure RTC registers
          </p>
        </div>

        <button
          onClick={async () => {
            await syncWithBrowserTime();
            onClose();
          }}
          disabled={isSyncing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#E8E7E1] dark:bg-[#171715] hover:bg-[#D0CFC8]/50 text-xs font-medium text-[#171717] dark:text-[#F2F0E9] border border-[#D0CFC8] dark:border-[#2F2F2B] transition-colors"
          title="Sync with current device time"
        >
          <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
          <span>Sync Browser Time</span>
        </button>
      </div>

      {/* DISTINCTIVE MECHANICAL SCROLL WHEELS (Curved SVG Silhouette from reference) */}
      <div className="relative w-full h-[230px] my-4 flex items-center justify-center overflow-hidden">
        {/* Curved intersecting background SVG */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-60 dark:opacity-30">
          <svg
            className="w-full h-full"
            viewBox="0 0 450 230"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 60 10 C 130 40, 150 90, 150 115 C 150 140, 130 190, 60 220"
              stroke="#D0CFC8"
              strokeWidth="1.5"
              fill="rgba(232, 231, 225, 0.4)"
            />
            <path
              d="M 390 10 C 320 40, 300 90, 300 115 C 300 140, 320 190, 390 220"
              stroke="#D0CFC8"
              strokeWidth="1.5"
              fill="rgba(232, 231, 225, 0.4)"
            />
          </svg>
        </div>

        {/* Center horizontal selection bar highlight */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-14 pointer-events-none border-y border-[#D0CFC8] dark:border-[#2F2F2B] bg-[#171717]/[0.02] dark:bg-white/[0.02] rounded-lg" />

        {/* 3 Columns: Hour, Minute, Second */}
        <div className="relative z-10 w-full max-w-md flex items-center justify-around h-full">
          {/* HOUR WHEEL */}
          <div
            ref={hourContainerRef}
            tabIndex={0}
            role="spinbutton"
            aria-label="Hour"
            aria-valuenow={selectedHour}
            onWheel={handleHourWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleHourTouchMove}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') { e.preventDefault(); changeHour(-1); }
              else if (e.key === 'ArrowDown') { e.preventDefault(); changeHour(1); }
            }}
            className="flex-1 h-full flex flex-col items-center justify-center cursor-ns-resize focus:outline-none focus:ring-1 focus:ring-[#E9D82C] rounded-2xl"
          >
            <span className="text-[10px] font-mono text-[#85847F] uppercase tracking-wider mb-1">Hour</span>
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

          <span className="text-2xl font-light text-[#85847F] pb-2">:</span>

          {/* MINUTE WHEEL */}
          <div
            ref={minuteContainerRef}
            tabIndex={0}
            role="spinbutton"
            aria-label="Minute"
            aria-valuenow={selectedMinute}
            onWheel={handleMinuteWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleMinuteTouchMove}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') { e.preventDefault(); changeMinute(-1); }
              else if (e.key === 'ArrowDown') { e.preventDefault(); changeMinute(1); }
            }}
            className="flex-1 h-full flex flex-col items-center justify-center cursor-ns-resize focus:outline-none focus:ring-1 focus:ring-[#E9D82C] rounded-2xl"
          >
            <span className="text-[10px] font-mono text-[#85847F] uppercase tracking-wider mb-1">Min</span>
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

          <span className="text-2xl font-light text-[#85847F] pb-2">:</span>

          {/* SECOND WHEEL */}
          <div
            ref={secondContainerRef}
            tabIndex={0}
            role="spinbutton"
            aria-label="Second"
            aria-valuenow={selectedSecond}
            onWheel={handleSecondWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleSecondTouchMove}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') { e.preventDefault(); changeSecond(-1); }
              else if (e.key === 'ArrowDown') { e.preventDefault(); changeSecond(1); }
            }}
            className="flex-1 h-full flex flex-col items-center justify-center cursor-ns-resize focus:outline-none focus:ring-1 focus:ring-[#E9D82C] rounded-2xl"
          >
            <span className="text-[10px] font-mono text-[#85847F] uppercase tracking-wider mb-1">Sec</span>
            {offsets.map((offset) => {
              const s = (selectedSecond + offset + 60) % 60;
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
                  key={`s-${offset}`}
                  onClick={() => changeSecond(offset)}
                  style={{ opacity }}
                  className={`h-9 flex items-center justify-center transition-all duration-150 tabular-nums ${scale} ${color} ${
                    isCenter ? 'text-4xl font-light text-[#171717] dark:text-[#F2F0E9]' : 'text-2xl'
                  }`}
                >
                  {padZero(s)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save / Cancel Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#D0CFC8]/40 dark:border-[#2F2F2B]">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-full text-xs font-medium text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={isSyncing}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-sm disabled:opacity-50"
        >
          <Check size={14} strokeWidth={2.5} />
          <span>Save Time</span>
        </button>
      </div>
    </div>
  );
};
