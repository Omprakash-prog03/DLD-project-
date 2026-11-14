import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { RefreshCw, Bell, Plus, CalendarPlus, ChevronRight, CheckCircle2 } from 'lucide-react';
import { TabType } from './BottomNavigation';

interface HomeScreenProps {
  onNavigate: (tab: TabType) => void;
  onOpenCreateAlarm: () => void;
  onOpenCreateEvent: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onOpenCreateAlarm,
  onOpenCreateEvent,
}) => {
  const {
    currentTime,
    deviceStatus,
    alarms,
    syncWithBrowserTime,
    isSyncing,
    timeFormat,
  } = useAppStore();

  const is24H = timeFormat === '24h';
  const displayHour = is24H
    ? currentTime.hour
    : currentTime.hour === 0
    ? 12
    : currentTime.hour > 12
    ? currentTime.hour - 12
    : currentTime.hour;

  const timeString = `${String(displayHour).padStart(2, '0')}:${String(
    currentTime.minute
  ).padStart(2, '0')}`;
  const amPm = !is24H ? (currentTime.hour >= 12 ? ' PM' : ' AM') : '';

  // Current formatted date
  const now = new Date(currentTime.year, currentTime.month - 1, currentTime.day);
  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Active alarms & Next alarm
  const activeAlarms = alarms.filter((a) => a.enabled);
  const nextAlarm = activeAlarms[0] || null;

  return (
    <div className="flex-1 overflow-y-auto px-[18px] py-4 space-y-4 no-scrollbar">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-[13px] font-medium text-neutral-400">Good morning</p>
          <h1 className="text-[28px] font-bold text-white tracking-tight">Mike</h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('device')}
          className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center text-white hover:bg-neutral-700 transition"
        >
          <Bell size={18} />
        </button>
      </div>

      {/* Block A — Current Time Hero Card (Red-Orange Fill #E84B2F) */}
      <div
        onClick={() => onNavigate('device')}
        className="cursor-pointer bg-[#E84B2F] rounded-[24px] p-5 text-white transition-transform active:scale-[0.99]"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-baseline">
            <span className="text-[76px] font-extrabold tracking-[-2px] leading-none">
              {timeString}
            </span>
            {amPm && <span className="text-xl font-bold ml-2 opacity-80">{amPm}</span>}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              syncWithBrowserTime();
            }}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
            title="Sync with phone time"
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
          </button>
        </div>

        <p className="text-white/80 text-[15px] font-medium mt-1">{dateString}</p>
        <p className="text-white/60 text-[12px] mt-0.5">Timezone: Asia/Kolkata • DS3231 RTC</p>
      </div>

      {/* Block B — Dual Metric Row (50/50 Split, 110dp Height) */}
      <div className="grid grid-cols-2 gap-3 h-[110px]">
        {/* Left Card: White Contrast Card (Next Alarm) */}
        <div
          onClick={() => onNavigate('alarms')}
          className="cursor-pointer bg-white rounded-[24px] p-4 flex flex-col justify-between transition-transform active:scale-[0.98]"
        >
          <div className="text-[32px] font-bold text-[#1A1A1A] tracking-tight leading-none">
            {nextAlarm
              ? `${String(nextAlarm.hour).padStart(2, '0')}:${String(
                  nextAlarm.minute
                ).padStart(2, '0')}`
              : '--:--'}
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-neutral-500 font-semibold">Next Alarm</span>
            <span className="text-[#E84B2F] font-bold">
              {nextAlarm ? 'M T W T F' : 'None'}
            </span>
          </div>
        </div>

        {/* Right Card: Blue Fill Card (Active Alarms) */}
        <div
          onClick={() => onNavigate('alarms')}
          className="cursor-pointer bg-[#3B5BDB] rounded-[24px] p-4 flex flex-col justify-between text-white transition-transform active:scale-[0.98]"
        >
          <div className="text-[32px] font-bold tracking-tight leading-none">
            {activeAlarms.length}
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-white/80 font-semibold">Active Alarms</span>
            <span className="text-white font-bold">Manage →</span>
          </div>
        </div>
      </div>

      {/* Block D — Device Status Strip */}
      <div
        onClick={() => onNavigate('device')}
        className="cursor-pointer bg-[#1E1E1E] rounded-[24px] px-5 py-3.5 flex items-center justify-between transition active:bg-[#252525]"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              deviceStatus.connected
                ? 'bg-[#2ECC71] shadow-[0_0_8px_#2ECC71]'
                : 'bg-neutral-500'
            }`}
          />
          <div>
            <h4 className="text-[15px] font-bold text-white leading-tight">
              {deviceStatus.deviceName}
            </h4>
            <p className="text-[11px] text-neutral-400">
              {deviceStatus.connected
                ? `Firmware: ${deviceStatus.firmwareVersion} • RTC Active`
                : 'Offline (Showing cached info)'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${
              deviceStatus.connected
                ? 'bg-[#2ECC71]/20 text-[#2ECC71]'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {deviceStatus.connected ? 'Connected' : 'Offline'}
          </span>
          <ChevronRight size={18} className="text-neutral-500" />
        </div>
      </div>

      {/* Block E — Quick Actions Row */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        <button
          type="button"
          onClick={onOpenCreateAlarm}
          className="bg-[#1E1E1E] rounded-[20px] py-3.5 px-2 flex flex-col items-center justify-center hover:bg-[#252525] transition active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E84B2F] flex items-center justify-center text-white mb-1.5 shadow-md">
            <Plus size={20} />
          </div>
          <span className="text-[11px] font-semibold text-white">Set Alarm</span>
        </button>

        <button
          type="button"
          onClick={onOpenCreateEvent}
          className="bg-[#1E1E1E] rounded-[20px] py-3.5 px-2 flex flex-col items-center justify-center hover:bg-[#252525] transition active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-[#3B5BDB] flex items-center justify-center text-white mb-1.5 shadow-md">
            <CalendarPlus size={20} />
          </div>
          <span className="text-[11px] font-semibold text-white">Add Event</span>
        </button>

        <button
          type="button"
          onClick={() => syncWithBrowserTime()}
          className="bg-[#1E1E1E] rounded-[20px] py-3.5 px-2 flex flex-col items-center justify-center hover:bg-[#252525] transition active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E84B2F] flex items-center justify-center text-white mb-1.5 shadow-md">
            <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
          </div>
          <span className="text-[11px] font-semibold text-white">Sync Time</span>
        </button>
      </div>

      {/* Block C — Today's Schedule */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[20px] font-bold text-white">Today</h3>
          <button
            type="button"
            onClick={() => onNavigate('calendar')}
            className="text-[13px] font-semibold text-[#E84B2F] hover:underline"
          >
            See all &gt;
          </button>
        </div>

        <div className="space-y-2.5">
          <div
            onClick={() => onNavigate('calendar')}
            className="cursor-pointer bg-[#1E1E1E] rounded-[20px] p-4 border-l-4 border-[#3B5BDB] flex items-center justify-between"
          >
            <div>
              <p className="text-[12px] text-neutral-400 font-medium">10:00 - 11:30</p>
              <h4 className="text-[15px] font-bold text-white mt-0.5">ESP32 Circuit Validation</h4>
              <p className="text-[12px] text-neutral-400 mt-0.5">Check 74HCT245 & CD4518 timing</p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-[#3B5BDB]/20 text-[#3B5BDB] rounded-md">
              Study
            </span>
          </div>

          <div
            onClick={() => onNavigate('calendar')}
            className="cursor-pointer bg-[#1E1E1E] rounded-[20px] p-4 border-l-4 border-[#7B2DBF] flex items-center justify-between"
          >
            <div>
              <p className="text-[12px] text-neutral-400 font-medium">15:00 - 16:00</p>
              <h4 className="text-[15px] font-bold text-white mt-0.5">DS3231 I2C Drift Testing</h4>
              <p className="text-[12px] text-neutral-400 mt-0.5">Oscillator stability measurement</p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-[#7B2DBF]/20 text-[#7B2DBF] rounded-md">
              Work
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
