import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { RefreshCw, Upload, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { padZero } from '../../utils/timeCalculations';

export const ClockSettingsView: React.FC = () => {
  const {
    currentTime,
    timeFormat,
    setTimeFormat,
    setDeviceTime,
    refreshDeviceTime,
    syncWithBrowserTime,
    isSyncing,
    operatingMode,
    deviceStatus,
    lastActionMessage,
    lastActionError,
    clearActionMessage,
  } = useAppStore();

  const [inputHour, setInputHour] = useState<number>(currentTime.hour);
  const [inputMinute, setInputMinute] = useState<number>(currentTime.minute);
  const [inputSecond, setInputSecond] = useState<number>(currentTime.second);
  const [inputDate, setInputDate] = useState<string>(
    `${currentTime.year}-${padZero(currentTime.month)}-${padZero(currentTime.day)}`
  );

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleManualTimeSubmit = () => {
    // Validate
    if (isNaN(inputHour) || inputHour < 0 || inputHour > 23) {
      setValidationError('Hour must be between 0 and 23');
      return;
    }
    if (isNaN(inputMinute) || inputMinute < 0 || inputMinute > 59) {
      setValidationError('Minute must be between 0 and 59');
      return;
    }
    if (isNaN(inputSecond) || inputSecond < 0 || inputSecond > 59) {
      setValidationError('Second must be between 0 and 59');
      return;
    }
    if (!inputDate) {
      setValidationError('Valid date is required');
      return;
    }

    setValidationError(null);
    setShowConfirmModal(true);
  };

  const confirmSetTime = async () => {
    setShowConfirmModal(false);
    const [year, month, day] = inputDate.split('-').map(Number);
    await setDeviceTime({
      hour: inputHour,
      minute: inputMinute,
      second: inputSecond,
      day,
      month,
      year,
    });
  };

  return (
    <div className="w-full flex flex-col space-y-4 px-1 pb-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[#171717] dark:text-[#F2F0E9] tracking-tight">
          Clock Configuration
        </h2>
        <p className="text-xs text-[#85847F] dark:text-[#999890]">
          Manage hardware RTC registers and clock synchronizations
        </p>
      </div>

      {/* Action Messages */}
      {lastActionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle size={15} />
            <span>{lastActionMessage}</span>
          </div>
          <button onClick={clearActionMessage} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {lastActionError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={15} />
            <span>{lastActionError}</span>
          </div>
          <button onClick={clearActionMessage} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Clock Source Status Card */}
      <div className="p-4 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/50 dark:border-[#2F2F2B]">
        <span className="text-[10px] font-semibold text-[#85847F] dark:text-[#999890] uppercase tracking-wider">
          Active Time Source
        </span>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                currentTime.source === 'DS3231' ? 'bg-emerald-500 animate-pulse' : 'bg-[#E9D82C]'
              }`}
            />
            <span className="text-sm font-semibold text-[#171717] dark:text-[#F2F0E9]">
              {currentTime.source === 'DS3231'
                ? 'DS3231 Hardware RTC (I2C 0x68)'
                : currentTime.source === 'ESP32_INTERNAL'
                ? 'ESP32 Internal Software Timer'
                : 'Software Clock (Simulated)'}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#85847F] dark:text-[#999890]">
            Asia/Kolkata (IST)
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#85847F] dark:text-[#999890] pt-2 border-t border-[#C9C8C1]/30 dark:border-[#2F2F2B]">
          <div>
            <span>RTC Status: </span>
            <strong className="text-[#171717] dark:text-[#F2F0E9]">
              {deviceStatus.rtcAvailable ? 'Available & Calibrated' : 'Not Detected'}
            </strong>
          </div>
          <div>
            <span>Target Device: </span>
            <strong className="text-[#171717] dark:text-[#F2F0E9] font-mono">
              {operatingMode === 'hardware' ? deviceStatus.ipAddress : 'Simulation Mode'}
            </strong>
          </div>
        </div>
      </div>

      {/* 3 Synchronization Actions (from Section 4.B) */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-[#85847F] dark:text-[#999890] uppercase tracking-wider px-1">
          Synchronization Operations
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Action 1: Set Device Time from Website */}
          <button
            onClick={() => syncWithBrowserTime()}
            disabled={isSyncing}
            className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-[#171717] text-white dark:bg-[#F2F0E9] dark:text-[#171717] text-xs font-medium shadow-xs hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
          >
            <Upload size={14} />
            <span>Sync Browser Time</span>
          </button>

          {/* Action 2: Read Time from ESP32 */}
          <button
            onClick={() => refreshDeviceTime()}
            disabled={isSyncing}
            className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-[#F2F1EC] dark:bg-[#22221F] border border-[#C9C8C1]/60 dark:border-[#2F2F2B] text-[#171717] dark:text-[#F2F0E9] text-xs font-medium hover:bg-[#E8E7E1] dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            <span>Read Device Time</span>
          </button>

          {/* Action 3: Verify & Calibrate */}
          <button
            onClick={async () => {
              await refreshDeviceTime();
              syncWithBrowserTime();
            }}
            disabled={isSyncing}
            className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-[#F2F1EC] dark:bg-[#22221F] border border-[#C9C8C1]/60 dark:border-[#2F2F2B] text-[#171717] dark:text-[#F2F0E9] text-xs font-medium hover:bg-[#E8E7E1] dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>Calibrate RTC</span>
          </button>
        </div>
      </div>

      {/* Manual Time Input Form */}
      <div className="p-4 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/50 dark:border-[#2F2F2B] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#171717] dark:text-[#F2F0E9]">
            Manual Hardware Clock Setting
          </span>
          <div className="flex items-center space-x-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg">
            <button
              onClick={() => setTimeFormat('24h')}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                timeFormat === '24h'
                  ? 'bg-white dark:bg-black text-[#171717] dark:text-white shadow-xs'
                  : 'text-[#85847F]'
              }`}
            >
              24H
            </button>
            <button
              onClick={() => setTimeFormat('12h')}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                timeFormat === '12h'
                  ? 'bg-white dark:bg-black text-[#171717] dark:text-white shadow-xs'
                  : 'text-[#85847F]'
              }`}
            >
              12H
            </button>
          </div>
        </div>

        {validationError && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{validationError}</p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] uppercase font-mono text-[#85847F] dark:text-[#999890] block mb-1">
              Hour (0-23)
            </label>
            <input
              type="number"
              min="0"
              max="23"
              value={inputHour}
              onChange={(e) => setInputHour(parseInt(e.target.value, 10))}
              className="w-full bg-[#E8E7E1] dark:bg-[#171715] rounded-xl px-3 py-2 text-center text-sm font-medium border border-[#C9C8C1]/40 dark:border-[#2F2F2B] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-[#85847F] dark:text-[#999890] block mb-1">
              Minute (0-59)
            </label>
            <input
              type="number"
              min="0"
              max="59"
              value={inputMinute}
              onChange={(e) => setInputMinute(parseInt(e.target.value, 10))}
              className="w-full bg-[#E8E7E1] dark:bg-[#171715] rounded-xl px-3 py-2 text-center text-sm font-medium border border-[#C9C8C1]/40 dark:border-[#2F2F2B] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-[#85847F] dark:text-[#999890] block mb-1">
              Second (0-59)
            </label>
            <input
              type="number"
              min="0"
              max="59"
              value={inputSecond}
              onChange={(e) => setInputSecond(parseInt(e.target.value, 10))}
              className="w-full bg-[#E8E7E1] dark:bg-[#171715] rounded-xl px-3 py-2 text-center text-sm font-medium border border-[#C9C8C1]/40 dark:border-[#2F2F2B] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-[#85847F] dark:text-[#999890] block mb-1">
            Calendar Date
          </label>
          <input
            type="date"
            value={inputDate}
            onChange={(e) => setInputDate(e.target.value)}
            className="w-full bg-[#E8E7E1] dark:bg-[#171715] rounded-xl px-3 py-2 text-sm font-medium border border-[#C9C8C1]/40 dark:border-[#2F2F2B] focus:outline-none"
          />
        </div>

        <button
          onClick={handleManualTimeSubmit}
          disabled={isSyncing}
          className="w-full py-2.5 rounded-xl bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Set Clock Registers
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#E8E7E1] dark:bg-[#22221F] rounded-3xl p-6 max-w-sm w-full border border-[#C9C8C1]/60 dark:border-[#2F2F2B] shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-semibold text-[#171717] dark:text-[#F2F0E9]">
              Confirm Hardware Clock Update
            </h3>
            <p className="text-xs text-[#85847F] dark:text-[#999890] mt-2">
              This will overwrite the DS3231 RTC registers via I2C with:
            </p>
            <div className="my-3 p-3 bg-white/40 dark:bg-black/20 rounded-xl text-center font-mono text-sm font-semibold">
              {padZero(inputHour)}:{padZero(inputMinute)}:{padZero(inputSecond)} on {inputDate}
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 rounded-xl bg-[#C9C8C1]/50 dark:bg-[#333] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmSetTime}
                className="flex-1 py-2 rounded-xl bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] text-xs font-semibold"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
