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
  Download,
  Smartphone,
  QrCode,
  ArrowDownToLine,
  ShieldCheck,
} from 'lucide-react';
import { SoundType } from '../../types';

interface SettingsScreenProps {
  onOpenDownload?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onOpenDownload }) => {
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

      {/* 0. Mobile App Downloads & Phone Installation */}
      <div>
        <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2">MOBILE APP DOWNLOADS</p>
        <div className="bg-[#1E1E1E] rounded-[24px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E84B2F] flex items-center justify-center text-white shrink-0">
                <Smartphone size={20} />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-white leading-tight flex items-center gap-1.5">
                  <span>Android Package (.apk)</span>
                  <ShieldCheck size={14} className="text-[#2ECC71]" />
                </h4>
                <p className="text-[11px] text-neutral-400">Signed release v1.0.0 installer</p>
              </div>
            </div>
            <a
              href="/downloads/smart-clock-release.apk"
              download="smart-clock-release.apk"
              className="px-3.5 py-2 bg-[#E84B2F] hover:bg-[#d03d22] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition"
            >
              <Download size={13} />
              <span>Get APK</span>
            </a>
          </div>

          <div className="border-t border-[#2A2A2A] pt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2A2A2A] flex items-center justify-center text-neutral-300 shrink-0">
                <Download size={18} />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-white leading-tight">Android App Bundle (.aab)</h4>
                <p className="text-[11px] text-neutral-400">Google Play Store distribution bundle</p>
              </div>
            </div>
            <a
              href="/downloads/smart-clock.aab"
              download="smart-clock.aab"
              className="px-3.5 py-2 bg-[#2A2A2A] hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
            >
              <span>Get AAB</span>
            </a>
          </div>

          <div className="border-t border-[#2A2A2A] pt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3B5BDB] flex items-center justify-center text-white shrink-0">
                <QrCode size={18} />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-white leading-tight">Scan Camera QR Code</h4>
                <p className="text-[11px] text-neutral-400">Open & install directly on smartphone</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDownload}
              className="px-3.5 py-2 bg-[#3B5BDB] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition"
            >
              <span>Show QR</span>
            </button>
          </div>
        </div>
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

          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Hardware uses CD4511 decoders powered by static 5.0V; no PWM blanking pin connected in current PCB revision. Control is disabled.
          </p>
        </div>
      </div>

      {/* 4. Buzzer & Sound Patterns (Confirmed Supported via GPIO 25 PWM) */}
      <div>
        <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2">ALARM SOUND PATTERNS</p>
        <div className="bg-[#1E1E1E] rounded-[24px] p-4 space-y-3">
          <div className="space-y-2">
            {soundOptions.map((opt) => (
              <div
                key={opt.id}
                onClick={() => setSelectedSound(opt.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  selectedSound === opt.id
                    ? 'border-[#E84B2F] bg-[#E84B2F]/10'
                    : 'border-[#2A2A2A] hover:border-neutral-700'
                }`}
              >
                <div>
                  <h5 className="text-sm font-bold text-white">{opt.label}</h5>
                  <p className="text-xs text-neutral-400">{opt.desc}</p>
                </div>
                {selectedSound === opt.id && (
                  <CheckCircle2 size={18} className="text-[#E84B2F]" />
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#2A2A2A] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-300">Test Hardware Buzzer</p>
              <p className="text-[11px] text-neutral-400">Sends pulse command to GPIO 25</p>
            </div>
            <button
              type="button"
              onClick={() => testBuzzer()}
              className="px-3 py-1.5 bg-[#E84B2F] hover:bg-[#d03d22] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Volume2 size={13} />
              <span>Test Audio</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Synchronization Preferences */}
      <div>
        <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2">SYNCHRONIZATION</p>
        <div className="bg-[#1E1E1E] rounded-[24px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-[14px] font-bold text-white">Auto-Sync on Connect</h5>
              <p className="text-[11px] text-neutral-400">Synchronize DS3231 RTC when link opens</p>
            </div>
            <input
              type="checkbox"
              checked={autoSyncOnConnect}
              onChange={(e) => setAutoSyncOnConnect(e.target.checked)}
              className="accent-[#E84B2F] w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="border-t border-[#2A2A2A] pt-3 flex items-center justify-between">
            <div>
              <h5 className="text-[14px] font-bold text-white">Auto-Cutoff Limit</h5>
              <p className="text-[11px] text-neutral-400">Firmware buzzer safety cutoff</p>
            </div>
            <span className="text-xs text-neutral-300 font-mono">120 sec</span>
          </div>
        </div>
      </div>

      {/* 6. Hardware Transport Mode Toggle */}
      <div>
        <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2">OPERATING MODE</p>
        <div className="bg-[#1E1E1E] rounded-[24px] p-4 space-y-3">
          <p className="text-xs text-neutral-400">
            Switch between simulated hardware for offline testing and real ESP32 Bluetooth / Wi-Fi links.
          </p>
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
              Mock Simulator
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
