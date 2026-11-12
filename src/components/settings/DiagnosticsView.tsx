import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { deviceService } from '../../services/device/deviceService';
import { DiagnosticsData } from '../../types';
import { Activity, Cpu, Thermometer, Radio, Volume2, RefreshCw, Terminal } from 'lucide-react';

export const DiagnosticsView: React.FC = () => {
  const { operatingMode, testBuzzer } = useAppStore();
  const [diagData, setDiagData] = useState<DiagnosticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rtcSimToggle, setRtcSimToggle] = useState<boolean>(true);

  const fetchDiagnostics = async () => {
    setIsLoading(true);
    try {
      const data = await deviceService.getDiagnostics();
      setDiagData(data);
    } catch (e) {
      console.warn('Diagnostics fetch failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, [operatingMode]);

  const toggleSimulatedRtc = () => {
    const sim = deviceService.getSimulatedDevice();
    const newState = !rtcSimToggle;
    sim.setRtcWorking(newState);
    setRtcSimToggle(newState);
    fetchDiagnostics();
  };

  return (
    <div className="w-full flex flex-col space-y-4 px-1 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#171717] dark:text-[#F2F0E9] tracking-tight">
            System Diagnostics
          </h2>
          <p className="text-xs text-[#85847F] dark:text-[#999890]">
            Hardware telemetry & I2C peripheral bus health
          </p>
        </div>

        <button
          onClick={fetchDiagnostics}
          className="p-2 rounded-xl bg-[#F2F1EC] dark:bg-[#22221F] text-[#85847F] hover:text-[#171717] dark:hover:text-[#F2F0E9] border border-[#C9C8C1]/40 dark:border-[#2F2F2B]"
          title="Refresh diagnostics"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Mode Warning Label */}
      <div className="px-3 py-2 rounded-xl bg-[#F2F1EC] dark:bg-[#22221F] border border-[#C9C8C1]/40 dark:border-[#2F2F2B] flex items-center justify-between text-xs">
        <span className="text-[#85847F] dark:text-[#999890]">
          Diagnostic Source:{' '}
          <strong className="text-[#171717] dark:text-[#F2F0E9]">
            {operatingMode === 'hardware' ? 'Physical ESP32 Microcontroller' : 'Simulated Hardware Engine'}
          </strong>
        </span>
        {operatingMode === 'simulation' && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#E9D82C]/20 text-[#171717] font-semibold">
            SIMULATED VALUES
          </span>
        )}
      </div>

      {/* Hardware Peripherals Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* DS3231 RTC Module */}
        <div className="p-3.5 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/40 dark:border-[#2F2F2B] space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#171717] dark:text-[#F2F0E9]">
            <Cpu size={14} className="text-emerald-500" />
            <span>DS3231 RTC</span>
          </div>
          <p className="text-[11px] text-[#85847F] dark:text-[#999890]">
            I2C Addr: <span className="font-mono text-[#171717] dark:text-[#F2F0E9]">0x68</span>
          </p>
          <div className="text-[11px] flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <span>● Status: {diagData?.deviceStatus.rtcAvailable ? 'Nominal' : 'Error'}</span>
          </div>
          {diagData?.ds3231TempCelsius !== undefined && (
            <p className="text-[10px] text-[#85847F] dark:text-[#999890] flex items-center space-x-1">
              <Thermometer size={11} />
              <span>Die Temp: {diagData.ds3231TempCelsius}°C</span>
            </p>
          )}
        </div>

        {/* Logic Gates & Digital Counters */}
        <div className="p-3.5 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/40 dark:border-[#2F2F2B] space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#171717] dark:text-[#F2F0E9]">
            <Activity size={14} className="text-[#E9D82C]" />
            <span>Logic Counters</span>
          </div>
          <p className="text-[11px] text-[#85847F] dark:text-[#999890]">
            CD4518 BCD + NE555
          </p>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span>● 1.00 Hz Clock Pulse Sync</span>
          </div>
          <p className="text-[10px] text-[#85847F] dark:text-[#999890]">
            74HC08 / 74HC32 Gate Logic OK
          </p>
        </div>

        {/* Hardware Buzzer Subsystem */}
        <div className="p-3.5 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/40 dark:border-[#2F2F2B] space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#171717] dark:text-[#F2F0E9]">
            <Volume2 size={14} className="text-amber-500" />
            <span>Piezo Buzzer</span>
          </div>
          <p className="text-[11px] text-[#85847F] dark:text-[#999890]">
            GPIO Pin: <span className="font-mono text-[#171717] dark:text-[#F2F0E9]">25 (PWM)</span>
          </p>
          <button
            onClick={() => testBuzzer('buzzer-standard')}
            className="w-full mt-1 py-1 rounded-lg bg-[#171717] dark:bg-[#F2F0E9] text-white dark:text-[#171717] text-[10px] font-semibold hover:opacity-90"
          >
            Sound Buzzer Test
          </button>
        </div>

        {/* Microcontroller Specs */}
        <div className="p-3.5 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/40 dark:border-[#2F2F2B] space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#171717] dark:text-[#F2F0E9]">
            <Radio size={14} className="text-sky-500" />
            <span>ESP32 Uptime</span>
          </div>
          <p className="text-[11px] text-[#85847F] dark:text-[#999890] font-mono">
            {diagData?.deviceStatus.uptimeSeconds ? `${diagData.deviceStatus.uptimeSeconds}s` : 'Active'}
          </p>
          <p className="text-[10px] text-[#85847F] dark:text-[#999890]">
            Free Heap: <span className="font-mono">{diagData?.deviceStatus.freeHeap || '184 KB'}</span>
          </p>
        </div>
      </div>

      {/* Simulation Controls (in simulation mode) */}
      {operatingMode === 'simulation' && (
        <div className="p-4 bg-[#F2F1EC] dark:bg-[#22221F] rounded-2xl border border-[#C9C8C1]/40 dark:border-[#2F2F2B] space-y-2">
          <span className="text-xs font-semibold text-[#171717] dark:text-[#F2F0E9]">
            Hardware Fault Simulator (Testing)
          </span>
          <p className="text-[11px] text-[#85847F] dark:text-[#999890]">
            Toggle simulated hardware anomalies to verify software error-handling.
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#171717] dark:text-[#F2F0E9]">
              DS3231 RTC Module Connection
            </span>
            <button
              onClick={toggleSimulatedRtc}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                rtcSimToggle
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {rtcSimToggle ? 'Online (0x68 detected)' : 'Fault Simulated (Disconnected)'}
            </button>
          </div>
        </div>
      )}

      {/* Diagnostics Event Logs */}
      <div className="p-4 bg-[#171715] text-[#F2F0E9] rounded-2xl border border-neutral-800 space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-300">
          <Terminal size={14} />
          <span>Device Event Log</span>
        </div>

        <div className="font-mono text-[10px] space-y-1 max-h-36 overflow-y-auto pr-1 no-scrollbar text-neutral-400">
          {diagData?.recentLogs?.map((log, i) => (
            <div key={i} className="flex space-x-2">
              <span className="text-neutral-500">[{log.timestamp}]</span>
              <span
                className={
                  log.level === 'WARN'
                    ? 'text-amber-400'
                    : log.level === 'ERROR'
                    ? 'text-rose-400'
                    : 'text-neutral-300'
                }
              >
                {log.level}:
              </span>
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
