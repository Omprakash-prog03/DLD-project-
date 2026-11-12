import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Radio, RefreshCw, Shield, Activity } from 'lucide-react';

export const DeviceConnectionView: React.FC = () => {
  const {
    operatingMode,
    setOperatingMode,
    hardwareIp,
    setHardwareIp,
    deviceStatus,
    testConnection,
    refreshDeviceStatus,
    isConnecting,
  } = useAppStore();

  const [inputIp, setInputIp] = useState<string>(hardwareIp);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);

  const handleIpSaveAndConnect = async () => {
    setHardwareIp(inputIp);
    if (operatingMode !== 'hardware') {
      await setOperatingMode('hardware');
    } else {
      const res = await testConnection();
      setTestResult(res);
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
          Manage Wi-Fi link, REST endpoints, and physical electronics sync
        </p>
      </div>

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

      {/* Connection Status Card */}
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
            {deviceStatus.operatingMode.toUpperCase()}
          </span>
        </div>

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
            <span>Last Communication: </span>
            <span className="text-[#171717] dark:text-[#F2F0E9] block">
              {deviceStatus.lastSeen ? new Date(deviceStatus.lastSeen).toLocaleTimeString() : 'Never'}
            </span>
          </div>
          <div>
            <span>RTC Module: </span>
            <span
              className={`block font-semibold ${
                deviceStatus.rtcAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
              }`}
            >
              {deviceStatus.rtcAvailable ? 'DS3231 OK' : 'Offline'}
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

      {/* Hardware IP & Network Config */}
      <div className="p-4 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/50 dark:border-[#2F2F2B] space-y-3">
        <span className="text-xs font-semibold text-[#171717] dark:text-[#F2F0E9]">
          ESP32 Network Endpoint
        </span>

        <div>
          <label className="text-[10px] uppercase font-mono text-[#85847F] dark:text-[#999890] block mb-1">
            Target IP Address (AP Mode Default: 192.168.4.1)
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

        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={handleTestPing}
            disabled={isConnecting}
            className="flex-1 py-2 rounded-xl bg-[#E8E7E1] dark:bg-[#171715] text-[#171717] dark:text-[#F2F0E9] text-xs font-medium border border-[#C9C8C1]/40 dark:border-[#2F2F2B] hover:bg-[#C9C8C1]/30 transition-colors flex items-center justify-center space-x-1.5"
          >
            <Activity size={13} />
            <span>Test Connection</span>
          </button>

          <button
            onClick={() => refreshDeviceStatus()}
            className="p-2 rounded-xl bg-[#E8E7E1] dark:bg-[#171715] text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] border border-[#C9C8C1]/40 dark:border-[#2F2F2B]"
            title="Refresh status"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Networking Guide & Mixed-Content Notice */}
      <div className="p-4 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/50 dark:border-[#2F2F2B] space-y-2 text-xs text-[#85847F] dark:text-[#999890]">
        <div className="flex items-center space-x-1.5 font-semibold text-[#171717] dark:text-[#F2F0E9]">
          <Shield size={14} className="text-[#E9D82C]" />
          <span>Local Hardware Network Architecture</span>
        </div>

        <p className="text-[11px] leading-relaxed">
          The ESP32 microcontroller runs an embedded HTTP REST server with CORS enabled. To control the clock:
        </p>

        <ul className="list-disc pl-4 space-y-1 text-[11px]">
          <li>
            <strong>Access Point (AP) Mode:</strong> Connect your device Wi-Fi to SSID <span className="font-mono text-[#171717] dark:text-[#F2F0E9]">DigitalClock-ESP32</span>. The clock IP is <span className="font-mono text-[#171717] dark:text-[#F2F0E9]">192.168.4.1</span>.
          </li>
          <li>
            <strong>Station (STA) Mode:</strong> When configured to join your home Wi-Fi, input the DHCP IP assigned by your router.
          </li>
          <li>
            <strong>Browser Mixed-Content Protection:</strong> Modern browsers prevent websites loaded over public HTTPS from issuing direct HTTP calls to private RFC-1918 subnets (192.168.x.x). For physical control, open this web app over local HTTP or install it locally.
          </li>
        </ul>
      </div>
    </div>
  );
};
