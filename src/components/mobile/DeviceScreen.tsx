import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Cpu,
  RefreshCw,
  Volume2,
  Bluetooth,
  Wifi,
  Search,
  CheckCircle2,
  XCircle,
  Terminal,
  Activity,
  Zap,
} from 'lucide-react';

export const DeviceScreen: React.FC = () => {
  const {
    deviceStatus,
    testBuzzer,
    syncWithBrowserTime,
    isSyncing,
    operatingMode,
    setOperatingMode,
    testConnection,
  } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<'status' | 'discovery' | 'diagnostics'>('status');
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([
    { id: 'ESP32-CLK-4A2F', name: 'Smart Clock ESP32', rssi: -54, type: 'BLE' },
    { id: '192.168.4.1', name: 'DigitalClock-ESP32', rssi: -42, type: 'Wi-Fi AP' },
  ]);

  const [diagnosticLogs, setDiagnosticLogs] = useState([
    { type: 'COMMAND', time: '21:30:02', text: 'GET_DEVICE_STATUS (Req ID: req-01)' },
    { type: 'RESPONSE', time: '21:30:02', text: 'OK • Heap: 184kB, RTC: Active, Free: 94%' },
    { type: 'COMMAND', time: '21:30:10', text: 'SYNC_CLOCK -> DS3231 (I2C 0x68)' },
    { type: 'RESPONSE', time: '21:30:10', text: 'ACK • CD4518 Sync Pulse Injected' },
  ]);

  const handleStartScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 3000);
  };

  const handleSendPing = async () => {
    const res = await testConnection();
    setDiagnosticLogs((prev) => [
      {
        type: res.success ? 'RESPONSE' : 'ERROR',
        time: new Date().toLocaleTimeString(),
        text: `PING • ${res.message} (${res.latencyMs}ms)`,
      },
      ...prev,
    ]);
  };

  return (
    <div className="flex-1 overflow-y-auto px-[18px] py-4 space-y-4 no-scrollbar">
      {/* Top Header & Sub-Tabs */}
      <div className="pt-1">
        <h1 className="text-[28px] font-bold text-white tracking-tight">Hardware</h1>
        
        {/* Navigation Sub-Tabs */}
        <div className="flex gap-2 mt-3">
          {(['status', 'discovery', 'diagnostics'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition ${
                activeSubTab === tab
                  ? 'bg-[#3B5BDB] text-white shadow-sm'
                  : 'bg-[#2A2A2A] text-neutral-400'
              }`}
            >
              {tab === 'status' ? 'Overview' : tab}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'status' && (
        <div className="space-y-4">
          {/* Status Hero Card */}
          <div
            className={`rounded-[24px] p-5 text-white transition-colors ${
              deviceStatus.connected ? 'bg-[#E84B2F]' : 'bg-[#1E1E1E] border border-[#2A2A2A]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[28px] font-extrabold tracking-tight block">
                  {deviceStatus.connected ? 'Connected' : 'Disconnected'}
                </span>
                <p className="text-white/80 text-[14px] font-medium mt-0.5">
                  {deviceStatus.deviceName}
                </p>
                <p className="text-white/60 text-[12px] mt-0.5">
                  IP: {deviceStatus.ipAddress} • {operatingMode.toUpperCase()} Mode
                </p>
              </div>
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  deviceStatus.connected
                    ? 'bg-[#2ECC71] shadow-[0_0_12px_#2ECC71]'
                    : 'bg-neutral-500'
                }`}
              />
            </div>
          </div>

          {/* Metric Row: Dual Cards */}
          <div className="grid grid-cols-2 gap-3 h-[110px]">
            {/* Left Card: White Contrast Card (Firmware) */}
            <div className="bg-white rounded-[24px] p-4 flex flex-col justify-between">
              <span className="text-[26px] font-extrabold text-[#1A1A1A] tracking-tight">
                {deviceStatus.firmwareVersion}
              </span>
              <span className="text-neutral-500 text-[12px] font-semibold">
                Firmware Version
              </span>
            </div>

            {/* Right Card: Blue Fill Card (RTC Status) */}
            <div className="bg-[#3B5BDB] rounded-[24px] p-4 flex flex-col justify-between text-white">
              <span className="text-[26px] font-extrabold tracking-tight">
                {deviceStatus.rtcAvailable ? 'OK' : 'FAIL'}
              </span>
              <span className="text-white/80 text-[12px] font-semibold">
                DS3231 RTC Status
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => syncWithBrowserTime()}
              className="bg-[#1E1E1E] rounded-[20px] p-4 flex items-center gap-3 hover:bg-[#252525] transition active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E84B2F] flex items-center justify-center text-white">
                <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-bold text-white">Sync Time</p>
                <p className="text-[11px] text-neutral-400">Write to DS3231</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => testBuzzer()}
              className="bg-[#1E1E1E] rounded-[20px] p-4 flex items-center gap-3 hover:bg-[#252525] transition active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#3B5BDB] flex items-center justify-center text-white">
                <Volume2 size={20} />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-bold text-white">Buzzer Test</p>
                <p className="text-[11px] text-neutral-400">200ms 2.4kHz Beep</p>
              </div>
            </button>
          </div>

          {/* Hardware Circuit Architecture Specifications */}
          <div className="bg-[#1E1E1E] rounded-[24px] p-5 space-y-3">
            <h3 className="text-[16px] font-bold text-white">Physical Circuit Pinout</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
                <span className="text-neutral-400">GPIO 21 (I2C SDA)</span>
                <span className="text-white font-mono">DS3231 Data (3.3V)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
                <span className="text-neutral-400">GPIO 22 (I2C SCL)</span>
                <span className="text-white font-mono">DS3231 Clock (100kHz)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
                <span className="text-neutral-400">GPIO 25 (PWM)</span>
                <span className="text-white font-mono">2N2222 Buzzer Driver</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2A2A2A]">
                <span className="text-neutral-400">GPIO 26 / 27</span>
                <span className="text-white font-mono">CD4518 Sync & Reset (74HCT245)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">GPIO 34 (Input)</span>
                <span className="text-white font-mono">DS3231 1Hz SQW PPS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'discovery' && (
        <div className="space-y-4">
          {/* Radar Scanning Card */}
          <div className="bg-[#3B5BDB] rounded-[24px] p-6 text-center text-white">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center mb-3">
              {isScanning && (
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
              )}
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Search size={30} className={isScanning ? 'animate-pulse' : ''} />
              </div>
            </div>
            <h3 className="text-lg font-bold">
              {isScanning ? 'Scanning for Clocks...' : 'Device Discovery'}
            </h3>
            <p className="text-xs text-white/80 mt-1">
              Bluetooth LE & Local SoftAP Broadcasts
            </p>
            <button
              type="button"
              onClick={handleStartScan}
              disabled={isScanning}
              className="mt-4 px-6 py-2.5 bg-white text-[#3B5BDB] font-bold rounded-xl text-xs hover:bg-neutral-100 transition"
            >
              {isScanning ? 'Scanning...' : 'Start New Scan'}
            </button>
          </div>

          {/* Discovered Devices */}
          <div>
            <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2.5">
              NEARBY CLOCKS
            </p>
            <div className="space-y-2.5">
              {discoveredDevices.map((dev) => (
                <div
                  key={dev.id}
                  className="bg-[#1E1E1E] rounded-[20px] p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2A2A2A] flex items-center justify-center text-white">
                      {dev.type === 'BLE' ? <Bluetooth size={20} /> : <Wifi size={20} />}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-white">{dev.name}</h4>
                      <p className="text-[11px] text-neutral-400">
                        {dev.id} • Signal: {dev.rssi} dBm
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOperatingMode(dev.type === 'BLE' ? 'simulation' : 'hardware');
                    }}
                    className="px-3.5 py-1.5 bg-[#E84B2F] text-white text-xs font-bold rounded-lg hover:bg-[#d03d22] transition"
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'diagnostics' && (
        <div className="space-y-4">
          {/* Developer Tool Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleSendPing}
              className="bg-[#1E1E1E] rounded-[20px] p-3 text-center text-xs font-bold text-white hover:bg-[#252525] transition"
            >
              Send Ping Frame
            </button>
            <button
              type="button"
              onClick={() => testBuzzer()}
              className="bg-[#1E1E1E] rounded-[20px] p-3 text-center text-xs font-bold text-white hover:bg-[#252525] transition"
            >
              PWM Buzzer Test
            </button>
          </div>

          {/* Transaction Audit Log (Monospace Dark Card) */}
          <div className="bg-[#0A0A0A] rounded-[24px] p-4 border border-[#2A2A2A] font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2A2A2A]">
              <span className="text-neutral-400 font-bold">TRANSACTION LOG</span>
              <button
                type="button"
                onClick={() => setDiagnosticLogs([])}
                className="text-[10px] text-neutral-500 hover:text-neutral-300"
              >
                Clear
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
              {diagnosticLogs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        log.type === 'COMMAND'
                          ? 'bg-[#3B5BDB]/20 text-[#3B5BDB]'
                          : log.type === 'RESPONSE'
                          ? 'bg-[#2ECC71]/20 text-[#2ECC71]'
                          : 'bg-[#E84B2F]/20 text-[#E84B2F]'
                      }`}
                    >
                      {log.type}
                    </span>
                    <span className="text-neutral-500 text-[10px]">{log.time}</span>
                  </div>
                  <p className="text-neutral-300 mt-0.5 pl-1">{log.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
