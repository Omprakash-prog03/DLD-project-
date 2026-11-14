import React, { useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface DrumTimePickerProps {
  hour: number;
  minute: number;
  is24Hour?: boolean;
  onChange: (hour: number, minute: number) => void;
}

export const DrumTimePicker: React.FC<DrumTimePickerProps> = ({
  hour,
  minute,
  is24Hour = true,
  onChange,
}) => {
  const incrementHour = () => {
    onChange((hour + 1) % 24, minute);
  };

  const decrementHour = () => {
    onChange((hour - 1 + 24) % 24, minute);
  };

  const incrementMinute = () => {
    onChange(hour, (minute + 1) % 60);
  };

  const decrementMinute = () => {
    onChange(hour, (minute - 1 + 60) % 60);
  };

  const displayHour = is24Hour
    ? hour
    : hour === 0
    ? 12
    : hour > 12
    ? hour - 12
    : hour;

  const isPm = hour >= 12;

  const prevHour = (hour - 1 + 24) % 24;
  const nextHour = (hour + 1) % 24;

  const prevMinute = (minute - 1 + 60) % 60;
  const nextMinute = (minute + 1) % 60;

  return (
    <div className="relative bg-[#1E1E1E] rounded-[24px] p-4 flex items-center justify-center select-none overflow-hidden h-[180px]">
      {/* Red-Orange Semi-Transparent Overlay Strip */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[56px] bg-[#E84B2F]/20 border border-[#E84B2F]/50 rounded-[16px] pointer-events-none" />

      <div className="flex items-center gap-6 z-10">
        {/* Hour Column */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={decrementHour}
            className="p-1 text-neutral-500 hover:text-white transition"
          >
            <ChevronUp size={20} />
          </button>
          
          <div className="text-neutral-500/50 text-xl font-bold tracking-tight h-6">
            {String(is24Hour ? prevHour : (prevHour % 12 || 12)).padStart(2, '0')}
          </div>

          <div className="text-white text-5xl font-extrabold tracking-tight h-14 flex items-center">
            {String(displayHour).padStart(2, '0')}
          </div>

          <div className="text-neutral-500/50 text-xl font-bold tracking-tight h-6">
            {String(is24Hour ? nextHour : (nextHour % 12 || 12)).padStart(2, '0')}
          </div>

          <button
            type="button"
            onClick={incrementHour}
            className="p-1 text-neutral-500 hover:text-white transition"
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {/* Separator */}
        <span className="text-white text-4xl font-extrabold pb-2">:</span>

        {/* Minute Column */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={decrementMinute}
            className="p-1 text-neutral-500 hover:text-white transition"
          >
            <ChevronUp size={20} />
          </button>

          <div className="text-neutral-500/50 text-xl font-bold tracking-tight h-6">
            {String(prevMinute).padStart(2, '0')}
          </div>

          <div className="text-white text-5xl font-extrabold tracking-tight h-14 flex items-center">
            {String(minute).padStart(2, '0')}
          </div>

          <div className="text-neutral-500/50 text-xl font-bold tracking-tight h-6">
            {String(nextMinute).padStart(2, '0')}
          </div>

          <button
            type="button"
            onClick={incrementMinute}
            className="p-1 text-neutral-500 hover:text-white transition"
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {/* AM / PM Column if 12h */}
        {!is24Hour && (
          <div className="flex flex-col items-center ml-2">
            <button
              type="button"
              onClick={() => onChange(isPm ? hour - 12 : hour + 12, minute)}
              className="px-3 py-1 bg-[#2A2A2A] rounded-lg text-sm font-bold text-white hover:bg-[#E84B2F] transition"
            >
              {isPm ? 'PM' : 'AM'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
