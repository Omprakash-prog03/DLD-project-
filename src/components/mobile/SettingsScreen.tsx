import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Palette,
  Clock,
  Bell,
  Cpu,
  Volume2,
  Sun,
  AlertCircle,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { SoundType } from '../../types';

export const SettingsScreen: React.FC = () => {
  const {
    timeFormat,
    setTimeFormat,
    operatingMode,
    setOperatingMode,
    deviceStatus,
    testBuzzer,
  } = useAppStore();

  const [deviceName, setDeviceName] = useState(deviceStatus.deviceName || 'Smart Clock ESP32');
  const [selectedSound, setSelectedSound] = useState<SoundType>('buzzer-standard');
  const [autoSyncOnConnect, setAutoSyncOnConnect] = useState(true);
  const [buzzerCutoffSec, setBuzzerCutoffSec] = useState(120);

  const soundOptions: { id: SoundType; label: string; desc: string }[] = [
    { id: 'buzzer-standard', label: 'Standard Pulse', desc: '2.4kHz resonant pulse tone' },
    { id: 'buzzer-pulsed', label: 'Rapid Staccato', desc: 'Fast intermittent alert' },
    { id: 'buzzer-fast', label: 'High Priority', desc: 'Continuous alarm sequence' },
    { id: 'buzzer-gentle', label: 'Gentle Wake', desc: 'Gradually increasing interval' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-[18px] py-4 space-y-4 no-scrollbar">
      {/* Top Header */}
      <div className="pt-1">
        <h1 className="text-[28px] font-bold text-white tracking-tight">Settings</h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Confirmed Hardware & Companion Preferences
        </p>
      </div>

      {/* 1. Device Identification (Confirmed Supported) */}
      <div>
        <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2">DEVICE CONFIGURATION</p>
        <div className="bg-[#1E1E1E] rounded-[24px] p-4 space-y-3">
          <div>
            <label className="text-[13px] font-semibold text-neutral-300 block mb-1">
              Device Name (Advertised)
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full bg-[#111111] border border-[#2A2A2A] focus:border-[#E84B2F] rounded-xl px-3.5 py-2.5 text-white text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Time & Display Format (Confirmed Supported) */}
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
                {timeFormat === '24h' ? '21:30 (Military)' : '9:30 PM (12-Hour)'}
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

      {/* 3. Display Brightness Control (CONFIRMED UNSUPPORTED BY HARDWARE REV 1) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[12px] font-bold text-neutral-400 tracking-wider">DISPLAY BRIGHTNESS</p>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E84B2F]/20 text-[#E84B2F] rounded-md flex items-center gap-1">
            <AlertCircle size={10} />
            Hardware Unsupported
          </span>
        </div>
        <div className="bg-[#1E1E1E] rounded-[24px] p-4 space-y-3 opacity-60 pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2A2A2A] flex items-center justify-center text-neutral-400">
                <Sun size={18} />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-white">7-Segment Brightness</h4>
                <p className="text-[11px] text-neutral-400">Fixed 100% (5.0V Domain)</p>
              </div>
            </div>
            <span className="text-xs text-neutral-500 font-mono">100%</span>
          </div>
          <input
            type="range"
            disabled
            value={100}
            min={10}
            max={100}
            className="w-full accent-neutral-600"
          />
        </div>
        <p className="text-[11px] text-neutral-400 mt-1.5 px-1 leading-relaxed">
          <span className="text-[#E84B2F] font-semibold">Technical note:</span> Display hardware uses CD4511 BCD-to-7-segment decoders wired directly to the 5.0V power rail. PWM brightness modulation on the blanking pin is not present on current PCB revision 1.
        </p>
      </div>

      {/* 4. Buzzer & Alarm Audio Configuration (Confirmed Supported) */}
      <div>
        <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2">BUZZER & SOUND PATTERNS</p>
        <div className="bg-[#1E1E1E] rounded-[24px] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#2A2A2A]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E84B2F] flex items-center justify-center text-white">
                <Volume2 size={18} />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-white leading-tight">Audible Piezo Alarm</h4>
                <p className="text-[11px] text-neutral-400">GPIO 25 (2.4kHz Resonant PWM)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => testBuzzer(selectedSound)}
              className="px-3 py-1 bg-[#2A2A2A] hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition"
            >
              Test Tone
            </button>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-neutral-400 block mb-2">
              Alarm Sound Pattern
            </label>
            <div className="grid grid-cols-2 gap-2">
              {soundOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedSound(opt.id)}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    selectedSound === opt.id
                      ? 'bg-[#E84B2F]/15 border-[#E84B2F] text-white'
                      : 'bg-[#111111] border-[#2A2A2A] text-neutral-400 hover:text-white'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[#2A2A2A] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Auto-Silence Safety Cutoff</p>
              <p className="text-[10px] text-neutral-400">Firmware safety timer prevents continuous ringing</p>
            </div>
            <span className="text-xs font-bold text-[#E84B2F] bg-[#E84B2F]/20 px-2.5 py-1 rounded-md">
              120 seconds
            </span>
          </div>
        </div>
      </div>

      {/* 5. Synchronization Preferences (Confirmed Supported) */}
      <div>
        <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2">SYNCHRONIZATION POLICY</p>
        <div className="bg-[#1E1E1E] rounded-[24px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2A2A2A] flex items-center justify-center text-white">
                <RefreshCw size={18} />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-white leading-tight">Auto-Sync on Connect</h4>
                <p className="text-[11px] text-neutral-400">Update DS3231 RTC upon handshake</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoSyncOnConnect}
              onChange={(e) => setAutoSyncOnConnect(e.target.checked)}
              className="w-5 h-5 accent-[#E84B2F] cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-[#2A2A2A] flex justify-between items-center text-xs">
            <span className="text-neutral-400">Target Timezone Policy</span>
            <span className="text-white font-mono font-bold">Asia/Kolkata (UTC+5:30)</span>
          </div>
        </div>
      </div>

      {/* 6. Hardware Transport Mode */}
      <div>
        <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2">COMMUNICATION ADAPTER</p>
        <div className="bg-[#1E1E1E] rounded-[24px] p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
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

      {/* 7. Hardware & Firmware Verified Specifications */}
      <div>
        <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2">VERIFIED SPECIFICATIONS</p>
        <div className="bg-[#1E1E1E] rounded-[24px] p-4 text-xs space-y-2">
          <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
            <span className="text-neutral-400">Microcontroller</span>
            <span className="text-white font-medium">ESP32-WROOM-32 (240MHz)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
            <span className="text-neutral-400">Firmware Build</span>
            <span className="text-white font-mono">{deviceStatus.firmwareVersion}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
            <span className="text-neutral-400">Hardware RTC</span>
            <span className="text-white font-medium">DS3231 I2C (Address 0x68)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
            <span className="text-neutral-400">BCD Logic Counters</span>
            <span className="text-white font-medium">CD4518 Cascaded (5.0V)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
            <span className="text-neutral-400">Bus Buffer & Level Shifter</span>
            <span className="text-white font-medium">74HCT245 (DIR=HIGH, /OE=GND)</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-neutral-400">Protocol Handshake</span>
            <span className="text-[#2ECC71] font-bold">Version 1.0 (Strict ACK)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
