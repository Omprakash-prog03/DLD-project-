import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Radio, RefreshCw, Shield, Activity, PowerOff, CheckCircle2, AlertTriangle } from 'lucide-react';

export const DeviceConnectionView: React.FC = () => {
  const {
    operatingMode,
    setOperatingMode,
    hardwareIp,
    setHardwareIp,
    deviceStatus,
    testConnection,
    disconnectDevice,
    reconnectDevice,
    isConnecting,
    lastActionMessage,
    lastActionError,
    clearActionMessage,
  } = useAppStore();

  const [inputIp, setInputIp] = useState<string>(hardwareIp);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);

  const handleIpSaveAndConnect = async () => {
    setHardwareIp(inputIp);
    if (operatingMode !== 'hardware') {
      await setOperatingMode('hardware');
    } else {
      await reconnectDevice();
    }
  };

  const handleTestPing = async () => {
    const res = await testConnection();
    setTestResult(res);
  };

  return (
    <div className="w-full flex flex-col space-y-4 px-1 pb-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[#171717] dark:text-[#F2F0E9] tracking-tight">
          ESP32 Device Connection
        </h2>
        <p className="text-xs text-[#85847F] dark:text-[#999890]">
          Wi-Fi REST interface, connection status, and device identification
        </p>
      </div>

      {/* Action Messages */}
      {lastActionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={15} />
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

      {/* Mode Selector Pill (Simulation vs Hardware) */}
      <div className="p-1.5 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/50 dark:border-[#2F2F2B] flex items-center">
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

      {/* Connection Status & Identification Card */}
      <div className="p-4 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/50 dark:border-[#2F2F2B] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                deviceStatus.connected
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-sm font-semibold text-[#171717] dark:text-[#F2F0E9]">
              {deviceStatus.connected ? 'Device Connected' : 'Device Disconnected'}
            </span>
          </div>

          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#85847F] dark:text-[#999890]">
            {operatingMode === 'hardware' ? 'ESP32 Wi-Fi' : 'Simulation'}
          </span>
        </div>

        {/* Detailed Device Identification */}
        <div className="grid grid-cols-2 gap-2 text-xs text-[#85847F] dark:text-[#999890] pt-2 border-t border-[#C9C8C1]/30 dark:border-[#2F2F2B]">
          <div>
            <span>Device Model: </span>
            <strong className="text-[#171717] dark:text-[#F2F0E9] block font-mono">
              {deviceStatus.deviceName}
            </strong>
          </div>
          <div>
            <span>Firmware Version: </span>
            <strong className="text-[#171717] dark:text-[#F2F0E9] block font-mono">
              {deviceStatus.firmwareVersion}
            </strong>
          </div>
          <div>
            <span>Target Endpoint: </span>
            <span className="text-[#171717] dark:text-[#F2F0E9] block font-mono">
              {deviceStatus.ipAddress}:80
            </span>
          </div>
          <div>
            <span>Wi-Fi Network: </span>
            <span className="text-[#171717] dark:text-[#F2F0E9] block">
              {deviceStatus.wifiSSID || 'DigitalClock-ESP32'} ({deviceStatus.wifiMode || 'AP'})
            </span>
          </div>
          <div>
            <span>Last Successful Sync: </span>
            <span className="text-[#171717] dark:text-[#F2F0E9] block">
              {deviceStatus.lastSeen ? new Date(deviceStatus.lastSeen).toLocaleTimeString() : 'Never'}
            </span>
          </div>
          <div>
            <span>DS3231 RTC Status: </span>
            <span
              className={`block font-semibold ${
                deviceStatus.rtcAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
              }`}
            >
              {deviceStatus.rtcAvailable ? 'Online (I2C 0x68)' : 'Not Detected'}
            </span>
          </div>
        </div>

        {/* Test Result Banner */}
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

      {/* Target IP Configuration & Connection Actions */}
      <div className="p-4 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/50 dark:border-[#2F2F2B] space-y-3">
        <span className="text-xs font-semibold text-[#171717] dark:text-[#F2F0E9]">
          Hardware IP Configuration & Actions
        </span>

        <div>
          <label className="text-[10px] uppercase font-mono text-[#85847F] dark:text-[#999890] block mb-1">
            ESP32 IP Address (SoftAP Default: 192.168.4.1)
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputIp}
              onChange={(e) => setInputIp(e.target.value)}
              placeholder="192.168.4.1"
              className="flex-1 bg-[#E8E7E1] dark:bg-[#171715] rounded-xl px-3 py-2 text-sm font-mono border border-[#C9C8C1]/40 dark:border-[#2F2F2B] focus:outline-none"
            />
            <button
              onClick={handleIpSaveAndConnect}
              disabled={isConnecting}
              className="px-4 py-2 rounded-xl bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>

        {/* 4 Dedicated Actions: Connect, Disconnect, Test Connection, Manual Reconnect */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={reconnectDevice}
            disabled={isConnecting}
            className="py-2.5 rounded-xl bg-[#E8E7E1] dark:bg-[#171715] text-[#171717] dark:text-[#F2F0E9] text-xs font-medium border border-[#C9C8C1]/40 dark:border-[#2F2F2B] hover:bg-[#C9C8C1]/30 transition-colors flex items-center justify-center space-x-1"
          >
            <RefreshCw size={12} className={isConnecting ? 'animate-spin' : ''} />
            <span>Reconnect</span>
          </button>

          <button
            onClick={handleTestPing}
            disabled={isConnecting}
            className="py-2.5 rounded-xl bg-[#E8E7E1] dark:bg-[#171715] text-[#171717] dark:text-[#F2F0E9] text-xs font-medium border border-[#C9C8C1]/40 dark:border-[#2F2F2B] hover:bg-[#C9C8C1]/30 transition-colors flex items-center justify-center space-x-1"
          >
            <Activity size={12} />
            <span>Test Link</span>
          </button>

          <button
            onClick={disconnectDevice}
            disabled={!deviceStatus.connected}
            className="py-2.5 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-medium border border-rose-500/20 hover:bg-rose-500/20 transition-colors flex items-center justify-center space-x-1 disabled:opacity-40"
          >
            <PowerOff size={12} />
            <span>Disconnect</span>
          </button>
        </div>
      </div>

      {/* Networking Guide & Security Constraints */}
      <div className="p-4 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/50 dark:border-[#2F2F2B] space-y-2 text-xs text-[#85847F] dark:text-[#999890]">
        <div className="flex items-center space-x-1.5 font-semibold text-[#171717] dark:text-[#F2F0E9]">
          <Shield size={14} className="text-[#E9D82C]" />
          <span>Local Hardware Network Architecture & Security</span>
        </div>

        <p className="text-[11px] leading-relaxed">
          The ESP32 microcontroller runs an embedded HTTP REST server with CORS enabled. To control the clock:
        </p>

        <ul className="list-disc pl-4 space-y-1 text-[11px]">
          <li>
            <strong>Access Point (SoftAP) Mode:</strong> Connect your phone, tablet, or laptop Wi-Fi directly to SSID <span className="font-mono text-[#171717] dark:text-[#F2F0E9]">DigitalClock-ESP32</span> (default IP: <span className="font-mono text-[#171717] dark:text-[#F2F0E9]">192.168.4.1</span>).
          </li>
          <li>
            <strong>Station (STA) Mode:</strong> In firmware, configure your local home Wi-Fi SSID and password to permit access from any device on your local LAN.
          </li>
          <li>
            <strong>Browser Mixed-Content Protection:</strong> Modern browsers prevent cloud-hosted HTTPS pages from issuing direct HTTP calls to private local subnets (192.168.x.x). A cloud-deployed website cannot automatically access your ESP32 from anywhere without local network presence or a local HTTP proxy.
          </li>
          <li>
            <strong>Security Boundary:</strong> The ESP32 REST API does not use authentication tokens and must never be exposed directly to the public internet.
          </li>
        </ul>
      </div>
    </div>
  );
};
