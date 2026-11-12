import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { X, Radio, RefreshCw, Activity, PowerOff, Shield, ChevronDown, ChevronUp } from 'lucide-react';

export const DeviceModal: React.FC = () => {
  const {
    isDeviceModalOpen,
    setIsDeviceModalOpen,
    operatingMode,
    setOperatingMode,
    hardwareIp,
    setHardwareIp,
    deviceStatus,
    testConnection,
    disconnectDevice,
    reconnectDevice,
    syncWithBrowserTime,
    testBuzzer,
    isConnecting,
    isSyncing,
  } = useAppStore();

  const [inputIp, setInputIp] = useState<string>(hardwareIp);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  if (!isDeviceModalOpen) return null;

  const handleConnect = async () => {
    setHardwareIp(inputIp);
    if (operatingMode !== 'hardware') {
      await setOperatingMode('hardware');
    } else {
      await reconnectDevice();
    }
  };

  const handleTestLink = async () => {
    const res = await testConnection();
    setTestResult(res);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#E8E7E1] dark:bg-[#171715] rounded-3xl p-6 sm:p-8 border border-[#D0CFC8] dark:border-[#2F2F2B] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D0CFC8]/40 dark:border-[#2F2F2B]">
          <div>
            <h2 className="text-base font-semibold text-[#171717] dark:text-[#F2F0E9] tracking-tight">
              Device Settings & Connectivity
            </h2>
            <p className="text-xs text-[#85847F] dark:text-[#999890]">
              Control communication with the ESP32 hardware
            </p>
          </div>

          <button
            onClick={() => setIsDeviceModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Operating Mode Selector (Simulation vs Hardware) */}
        <div className="p-1.5 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#D0CFC8]/60 dark:border-[#2F2F2B] flex items-center">
          <button
            onClick={() => setOperatingMode('simulation')}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
              operatingMode === 'simulation'
                ? 'bg-[#171717] text-white dark:bg-[#F2F0E9] dark:text-[#171717] shadow-xs'
                : 'text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9]'
            }`}
          >
            Simulation Mode
          </button>

          <button
            onClick={() => setOperatingMode('hardware')}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center space-x-1.5 ${
              operatingMode === 'hardware'
                ? 'bg-[#171717] text-white dark:bg-[#F2F0E9] dark:text-[#171717] shadow-xs'
                : 'text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9]'
            }`}
          >
            <Radio size={13} className={deviceStatus.connected ? 'text-emerald-400' : ''} />
            <span>Hardware Mode (ESP32)</span>
          </button>
        </div>

        {/* Connection Status & Details */}
        <div className="p-4 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#D0CFC8]/50 dark:border-[#2F2F2B] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  operatingMode === 'simulation'
                    ? 'bg-[#E9D82C]'
                    : deviceStatus.connected
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-sm font-semibold text-[#171717] dark:text-[#F2F0E9]">
                {operatingMode === 'simulation'
                  ? 'Simulation Engine Active'
                  : deviceStatus.connected
                  ? 'Connected to ESP32'
                  : 'Device Disconnected'}
              </span>
            </div>

            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#85847F]">
              {operatingMode.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-[#85847F] dark:text-[#999890] pt-2 border-t border-[#D0CFC8]/30 dark:border-[#2F2F2B]">
            <div>
              <span>Model: </span>
              <strong className="text-[#171717] dark:text-[#F2F0E9] font-mono block">
                {deviceStatus.deviceName}
              </strong>
            </div>
            <div>
              <span>Firmware: </span>
              <strong className="text-[#171717] dark:text-[#F2F0E9] font-mono block">
                {deviceStatus.firmwareVersion}
              </strong>
            </div>
            <div>
              <span>RTC Module: </span>
              <span
                className={`block font-semibold ${
                  deviceStatus.rtcAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                }`}
              >
                {deviceStatus.rtcAvailable ? 'DS3231 Online' : 'Offline'}
              </span>
            </div>
            <div>
              <span>Last Sync: </span>
              <span className="text-[#171717] dark:text-[#F2F0E9] block">
                {deviceStatus.lastSeen ? new Date(deviceStatus.lastSeen).toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center justify-between ${
                testResult.success
                  ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20'
              }`}
            >
              <span>{testResult.message}</span>
              {testResult.success && <span className="font-mono text-[10px]">{testResult.latencyMs}ms</span>}
            </div>
          )}
        </div>

        {/* IP Address & Primary Actions */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#85847F] dark:text-[#999890] block mb-1">
              ESP32 IP Address (SoftAP: 192.168.4.1)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputIp}
                onChange={(e) => setInputIp(e.target.value)}
                placeholder="192.168.4.1"
                className="flex-1 bg-[#F2F1EC] dark:bg-[#22221F] border border-[#D0CFC8]/60 dark:border-[#2F2F2B] rounded-2xl px-4 py-2.5 text-sm font-mono text-[#171717] dark:text-[#F2F0E9] focus:outline-none"
              />
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-5 py-2.5 rounded-2xl bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>

          {/* 3 Core Action Buttons: Disconnect, Test Link, Synchronize */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleTestLink}
              disabled={isConnecting}
              className="py-2.5 rounded-2xl bg-[#F2F1EC] dark:bg-[#22221F] border border-[#D0CFC8]/50 dark:border-[#2F2F2B] text-xs font-medium text-[#171717] dark:text-[#F2F0E9] hover:bg-[#D0CFC8]/40 transition-colors flex items-center justify-center space-x-1"
            >
              <Activity size={13} />
              <span>Test Link</span>
            </button>

            <button
              onClick={() => syncWithBrowserTime()}
              disabled={isSyncing}
              className="py-2.5 rounded-2xl bg-[#F2F1EC] dark:bg-[#22221F] border border-[#D0CFC8]/50 dark:border-[#2F2F2B] text-xs font-medium text-[#171717] dark:text-[#F2F0E9] hover:bg-[#D0CFC8]/40 transition-colors flex items-center justify-center space-x-1"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span>Sync Time</span>
            </button>

            <button
              onClick={disconnectDevice}
              disabled={!deviceStatus.connected}
              className="py-2.5 rounded-2xl bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 text-xs font-medium hover:bg-rose-500/20 transition-colors flex items-center justify-center space-x-1 disabled:opacity-40"
            >
              <PowerOff size={13} />
              <span>Disconnect</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Diagnostics Section (Hidden unless expanded) */}
        <div className="border-t border-[#D0CFC8]/40 dark:border-[#2F2F2B] pt-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] transition-colors py-1"
          >
            <span>Advanced Hardware Diagnostics</span>
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3 p-4 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#D0CFC8]/50 dark:border-[#2F2F2B] text-xs animate-in fade-in">
              <div className="grid grid-cols-2 gap-2 text-[#85847F] dark:text-[#999890]">
                <div>I2C Bus: <span className="font-mono text-[#171717] dark:text-[#F2F0E9]">0x68 (DS3231 RTC)</span></div>
                <div>Counter Sync: <span className="font-semibold text-emerald-600">1.0 Hz Active</span></div>
                <div>Level Shifter: <span className="text-[#171717] dark:text-[#F2F0E9]">74HCT245 (DIR=5V, /OE=GND)</span></div>
                <div>Buzzer Pin: <span className="font-mono text-[#171717] dark:text-[#F2F0E9]">GPIO 25 (2N2222)</span></div>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-[#D0CFC8]/30 dark:border-[#2F2F2B]">
                <button
                  onClick={() => testBuzzer('buzzer-standard')}
                  className="px-3 py-1.5 rounded-xl bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] text-xs font-medium hover:opacity-90"
                >
                  Test Hardware Buzzer (800ms)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security & Local Network Note */}
        <div className="p-3 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#D0CFC8]/40 dark:border-[#2F2F2B] text-[11px] text-[#85847F] dark:text-[#999890] flex items-start space-x-2">
          <Shield size={14} className="text-[#E9D82C] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Hardware control requires direct connectivity to the ESP32 Wi-Fi network (<strong>DigitalClock-ESP32</strong>) or local LAN. Cloud HTTPS websites cannot directly call private local IPs due to browser mixed-content security.
          </p>
        </div>
      </div>
    </div>
  );
};
