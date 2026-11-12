import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ChevronDown, RefreshCw, Award } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { buzzerAudio } from '../../services/audio/buzzerAudio';
import { padZero } from '../../utils/timeCalculations';

interface WakeUpGameProps {
  onComplete?: () => void;
  onDismiss?: () => void;
  isStandaloneTest?: boolean;
}

const ROWS = 9;
const COLS = 8;
const TOTAL_DOTS = ROWS * COLS;

export const WakeUpGame: React.FC<WakeUpGameProps> = ({
  onComplete,
  onDismiss,
}) => {
  const { dismissRingingAlarm, closeWakeUpGame } = useAppStore();

  // Grid state: set of cleaned dot indices
  const [cleanedDots, setCleanedDots] = useState<Set<number>>(new Set([0]));
  const [playerPos, setPlayerPos] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const timeLimitSeconds = 120; // 02:00 limit as shown in reference

  // Timer tick
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev >= timeLimitSeconds) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  // Clean a dot at (r, c)
  const moveTo = useCallback(
    (r: number, c: number) => {
      if (isCompleted) return;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;

      const idx = r * COLS + c;
      setPlayerPos({ r, c });

      setCleanedDots((prev) => {
        const next = new Set(prev);
        if (!next.has(idx)) {
          next.add(idx);
          buzzerAudio.playWheelTick();
        }

        // Completion threshold: 75% or 100% of dots cleaned
        if (next.size >= Math.floor(TOTAL_DOTS * 0.75) && !isCompleted) {
          handleVictory();
        }
        return next;
      });
    },
    [isCompleted]
  );

  const handleVictory = () => {
    setIsCompleted(true);
    buzzerAudio.stopAlarmRinging();
    buzzerAudio.playConfirm();

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#E9D82C', '#171717', '#F2F1EC', '#85847F'],
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      if (onComplete) onComplete();
      else dismissRingingAlarm();
    }, 1800);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return;
      if (e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        moveTo(playerPos.r - 1, playerPos.c);
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        e.preventDefault();
        moveTo(playerPos.r + 1, playerPos.c);
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        e.preventDefault();
        moveTo(playerPos.r, playerPos.c - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        moveTo(playerPos.r, playerPos.c + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, isCompleted, moveTo]);

  // Touch swipe handling
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isCompleted) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 20) {
      if (absX > absY) {
        moveTo(playerPos.r, playerPos.c + (dx > 0 ? 1 : -1));
      } else {
        moveTo(playerPos.r + (dy > 0 ? 1 : -1), playerPos.c);
      }
    }
    touchStartRef.current = null;
  };

  // Circular gauge progress
  const progressRatio = Math.min(1, cleanedDots.size / (TOTAL_DOTS * 0.75));
  const gaugeAngle = progressRatio * 300; // 300 degrees arc

  const elapsedMin = Math.floor(elapsedSeconds / 60);
  const elapsedSec = elapsedSeconds % 60;

  return (
    <div
      className="w-full h-full flex flex-col justify-between px-4 py-3 select-none relative animate-in fade-in duration-200"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header (Frames 14s & 16s in reference: "Clean Entire Field" + chevron) */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-semibold text-[#171717] dark:text-[#F2F0E9] tracking-tight">
            Clean Entire Field
          </h2>
          <p className="text-[11px] text-[#85847F] dark:text-[#999890]">
            Move the yellow dot to clean the field & stop alarm
          </p>
        </div>

        <button
          onClick={() => {
            if (onDismiss) onDismiss();
            else closeWakeUpGame();
          }}
          className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#85847F]"
          title="Exit game"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* CIRCULAR GAUGE & TIMER (Frames 14s & 16s) */}
      <div className="relative my-auto flex flex-col items-center justify-center">
        {/* SVG Circular Dial with yellow progress arc and mechanical indicator hands */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {/* Background track circle */}
            <circle
              cx="80"
              cy="80"
              r="60"
              stroke="#C9C8C1"
              strokeWidth="4"
              fill="none"
              strokeOpacity="0.3"
              strokeDasharray="4 4"
            />

            {/* Yellow Active Progress Arc (exact yellow #E9D82C) */}
            <circle
              cx="80"
              cy="80"
              r="60"
              stroke="#E9D82C"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(gaugeAngle / 360) * 377} 377`}
              className="transition-all duration-300"
            />
          </svg>

          {/* Center Mechanical Watch Indicator (from frames 14s/16s: 3 small radial hands) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Center pivot dot */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#171717] dark:bg-[#F2F0E9] z-10" />

              {/* Three minimalist gauge tick hands angled at 120 degrees */}
              <div
                className="absolute w-0.5 h-5 bg-[#171717] dark:bg-[#F2F0E9] rounded-full origin-bottom -top-2.5 transition-transform duration-500"
                style={{ transform: `rotate(${elapsedSeconds * 6}deg)` }}
              />
              <div
                className="absolute w-0.5 h-4 bg-[#85847F] rounded-full origin-bottom -top-1.5"
                style={{ transform: 'rotate(120deg)' }}
              />
              <div
                className="absolute w-0.5 h-4 bg-[#85847F] rounded-full origin-bottom -top-1.5"
                style={{ transform: 'rotate(240deg)' }}
              />
            </div>
          </div>
        </div>

        {/* Digital Elapsed vs Limit Timer (e.g. 00:19 ... 02:00) */}
        <div className="w-48 flex items-center justify-between text-xs font-mono font-medium text-[#171717] dark:text-[#F2F0E9] px-2 -mt-2">
          <span className="tabular-nums">
            {padZero(elapsedMin)}:{padZero(elapsedSec)}
          </span>
          <span className="text-[#85847F] dark:text-[#999890] text-[10px] uppercase tracking-wider font-sans">
            {Math.round(progressRatio * 100)}%
          </span>
          <span className="text-[#85847F] dark:text-[#999890] tabular-nums">02:00</span>
        </div>
      </div>

      {/* DOT MATRIX FIELD (Frames 12s, 14s, 16s in reference) */}
      <div className="w-full bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl p-4 border border-[#C9C8C1]/40 dark:border-[#2F2F2B]">
        <div
          className="grid gap-2 justify-center"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: TOTAL_DOTS }).map((_, index) => {
            const r = Math.floor(index / COLS);
            const c = index % COLS;
            const isPlayer = playerPos.r === r && playerPos.c === c;
            const isCleaned = cleanedDots.has(index);

            return (
              <button
                key={index}
                onClick={() => moveTo(r, c)}
                className="relative aspect-square flex items-center justify-center p-0.5 focus:outline-none"
              >
                {isPlayer ? (
                  /* Yellow Glowing Player Dot (Frames 14s & 16s) */
                  <div className="w-4 h-4 rounded-full bg-[#E9D82C] shadow-[0_0_12px_rgba(233,216,44,0.85)] scale-110 transition-transform animate-pulse" />
                ) : isCleaned ? (
                  /* Cleaned / Cleared Dot (Faint) */
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C9C8C1]/40 dark:bg-neutral-700 transition-colors" />
                ) : (
                  /* Uncleaned Dot (Solid dark dot) */
                  <div className="w-2 h-2 rounded-full bg-[#171717] dark:bg-[#F2F0E9] hover:scale-125 transition-transform" />
                )}
              </button>
            );
          })}
        </div>

        {/* Cleaned count status */}
        <div className="flex items-center justify-between text-[11px] text-[#85847F] dark:text-[#999890] mt-3 pt-2 border-t border-[#C9C8C1]/30 dark:border-[#2F2F2B]">
          <span>
            {cleanedDots.size} of {Math.floor(TOTAL_DOTS * 0.75)} dots cleared
          </span>
          <span className="font-mono text-[10px]">Use swipes, arrows or taps</span>
        </div>
      </div>

      {/* Bottom Emergency Action: Standard Dismiss */}
      <div className="flex items-center justify-between px-2 pt-2">
        <button
          onClick={() => {
            setCleanedDots(new Set([0]));
            setPlayerPos({ r: 0, c: 0 });
            setElapsedSeconds(0);
          }}
          className="flex items-center space-x-1 text-xs text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9]"
        >
          <RefreshCw size={13} />
          <span>Reset Field</span>
        </button>

        <button
          onClick={() => {
            buzzerAudio.stopAlarmRinging();
            dismissRingingAlarm();
          }}
          className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline px-2 py-1"
        >
          Emergency Dismiss
        </button>
      </div>

      {/* Completion Modal Overlay */}
      {isCompleted && (
        <div className="absolute inset-0 bg-[#E8E7E1]/95 dark:bg-[#171715]/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-[#E9D82C] text-[#171717] flex items-center justify-center mb-3 shadow-lg">
            <Award size={32} />
          </div>
          <h3 className="text-xl font-semibold text-[#171717] dark:text-[#F2F0E9] mb-1">
            Field Cleaned!
          </h3>
          <p className="text-xs text-[#85847F] dark:text-[#999890] mb-4">
            Brain awake and active. Alarm turned off.
          </p>
          <button
            onClick={() => {
              if (onComplete) onComplete();
              else dismissRingingAlarm();
            }}
            className="px-6 py-2.5 rounded-full bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] text-xs font-semibold shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            Start Your Day
          </button>
        </div>
      )}
    </div>
  );
};
