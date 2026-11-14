import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Palette, Clock, Bell, Cpu, ShieldCheck } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    timeFormat,
    setTimeFormat,
    operatingMode,
    setOperatingMode,
    deviceStatus,
  } = useAppStore();

  return (
    <div className="flex-1 overflow-y-auto px-[18px] py-4 space-y-4 no-scrollbar">
      {/* Top Header */}
      <div className="pt-1">
        <h1 className="text-[28px] font-bold text-white tracking-tight">Settings</h1>
      </div>

      {/* Appearance Section */}
      <div>
        <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2">APPEARANCE</p>
        <div className="bg-[#1E1E1E] rounded-[24px] p-4 space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-[#2A2A2A] flex items-center justify-center text-white">
              <Palette size={18} />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-white leading-tight">Theme</h4>
              <p className="text-[11px] text-neutral-400">High-Contrast Dark Mode</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl border-2 border-[#E84B2F] bg-black text-center cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-[#E84B2F] mx-auto mb-1" />
              <span className="text-xs font-bold text-white">Dark</span>
            </div>
            <div className="p-2.5 rounded-xl border border-[#2A2A2A] bg-white text-center opacity-60">
              <div className="w-4 h-4 rounded-full bg-black mx-auto mb-1" />
              <span className="text-xs font-bold text-black">Light</span>
            </div>
            <div className="p-2.5 rounded-xl border border-[#2A2A2A] bg-[#2A2A2A] text-center opacity-60">
              <div className="w-4 h-4 rounded-full bg-[#3B5BDB] mx-auto mb-1" />
              <span className="text-xs font-bold text-white">Auto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time & Clock Section */}
      <div>
        <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2">TIME FORMAT</p>
        <div className="bg-[#1E1E1E] rounded-[24px] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2A2A2A] flex items-center justify-center text-white">
              <Clock size={18} />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-white leading-tight">24-Hour Time</h4>
              <p className="text-[11px] text-neutral-400">
                {timeFormat === '24h' ? '21:30:00 (Military)' : '9:30:00 PM (12-Hour)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTimeFormat(timeFormat === '24h' ? '12h' : '24h')}
            className={`w-13 h-7 rounded-full p-1 cursor-pointer transition-colors duration-200 ${
              timeFormat === '24h' ? 'bg-[#E84B2F]' : 'bg-[#2A2A2A]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                timeFormat === '24h' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Hardware Transport Mode */}
      <div>
        <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2">HARDWARE MODE</p>
        <div className="bg-[#1E1E1E] rounded-[24px] p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2A2A2A] flex items-center justify-center text-white">
              <Cpu size={18} />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-white leading-tight">Communication Adapter</h4>
              <p className="text-[11px] text-neutral-400">
                Active: {operatingMode === 'simulation' ? 'Simulated Mock' : 'ESP32 Wi-Fi / BLE'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOperatingMode('simulation')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                operatingMode === 'simulation'
                  ? 'bg-[#E84B2F] text-white shadow-md'
                  : 'bg-[#2A2A2A] text-neutral-400'
              }`}
            >
              Simulated (Mock)
            </button>
            <button
              type="button"
              onClick={() => setOperatingMode('hardware')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                operatingMode === 'hardware'
                  ? 'bg-[#3B5BDB] text-white shadow-md'
                  : 'bg-[#2A2A2A] text-neutral-400'
              }`}
            >
              ESP32 Hardware
            </button>
          </div>
        </div>
      </div>

      {/* About & Specs */}
      <div>
        <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2">ABOUT & SPECS</p>
        <div className="bg-[#1E1E1E] rounded-[24px] p-4 text-xs space-y-2">
          <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
            <span className="text-neutral-400">Microcontroller</span>
            <span className="text-white font-medium">ESP32-WROOM-32 (240MHz)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
            <span className="text-neutral-400">Hardware RTC</span>
            <span className="text-white font-medium">DS3231 TCXO (I2C 0x68)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
            <span className="text-neutral-400">Logic Buffers</span>
            <span className="text-white font-medium">74HCT245 (DIR=HIGH, 5V)</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-neutral-400">App Architecture</span>
            <span className="text-[#E84B2F] font-bold">Mobile First v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
