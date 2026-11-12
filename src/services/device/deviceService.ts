import { Alarm, ClockTime, DeviceStatus, DiagnosticsData, IDeviceService, OperatingMode, SoundType } from '../../types';
import { HardwareDevice } from './hardwareDevice';
import { SimulatedDevice } from './simulatedDevice';

const MODE_STORAGE_KEY = 'dld_clock_operating_mode';
const IP_STORAGE_KEY = 'dld_clock_esp32_ip';

class DeviceManager implements IDeviceService {
  private simulated: SimulatedDevice;
  private hardware: HardwareDevice;
  private currentMode: OperatingMode = 'simulation';

  constructor() {
    this.simulated = new SimulatedDevice();

    let savedIp = '192.168.4.1';
    let savedMode: OperatingMode = 'simulation';

    if (typeof window !== 'undefined') {
      const storedIp = localStorage.getItem(IP_STORAGE_KEY);
      if (storedIp) savedIp = storedIp;

      const storedMode = localStorage.getItem(MODE_STORAGE_KEY);
      if (storedMode === 'hardware' || storedMode === 'simulation') {
        savedMode = storedMode;
      }
    }

    this.hardware = new HardwareDevice(savedIp);
    this.currentMode = savedMode;
  }

  public getOperatingMode(): OperatingMode {
    return this.currentMode;
  }

  public setOperatingMode(mode: OperatingMode): void {
    this.currentMode = mode;
    if (typeof window !== 'undefined') {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    }
  }

  public getHardwareIp(): string {
    return this.hardware.getIp();
  }

  public setHardwareIp(ip: string): void {
    this.hardware.setConnection(ip);
    if (typeof window !== 'undefined') {
      localStorage.setItem(IP_STORAGE_KEY, ip);
    }
  }

  public getActiveService(): IDeviceService {
    return this.currentMode === 'hardware' ? this.hardware : this.simulated;
  }

  public getSimulatedDevice(): SimulatedDevice {
    return this.simulated;
  }

  public getHardwareDevice(): HardwareDevice {
    return this.hardware;
  }

  // IDeviceService delegates
  public async getStatus(): Promise<DeviceStatus> {
    const status = await this.getActiveService().getStatus();
    return {
      ...status,
      operatingMode: this.currentMode,
    };
  }

  public async getTime(): Promise<ClockTime> {
    return this.getActiveService().getTime();
  }

  public async setTime(time: Partial<ClockTime>): Promise<{ success: boolean; message: string }> {
    return this.getActiveService().setTime(time);
  }

  public async getAlarms(): Promise<Alarm[]> {
    return this.getActiveService().getAlarms();
  }

  public async createAlarm(alarm: Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alarm> {
    return this.getActiveService().createAlarm(alarm);
  }

  public async updateAlarm(id: string, alarm: Partial<Alarm>): Promise<Alarm> {
    return this.getActiveService().updateAlarm(id, alarm);
  }

  public async deleteAlarm(id: string): Promise<boolean> {
    return this.getActiveService().deleteAlarm(id);
  }

  public async toggleAlarm(id: string, enabled?: boolean): Promise<Alarm> {
    return this.getActiveService().toggleAlarm(id, enabled);
  }

  public async dismissAlarm(id: string): Promise<boolean> {
    return this.getActiveService().dismissAlarm(id);
  }

  public async snoozeAlarm(id: string, minutes: number): Promise<boolean> {
    return this.getActiveService().snoozeAlarm(id, minutes);
  }

  public async getDiagnostics(): Promise<DiagnosticsData> {
    return this.getActiveService().getDiagnostics();
  }

  public async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    return this.getActiveService().testConnection();
  }

  public async triggerBuzzerTest(soundId: SoundType, durationMs: number): Promise<boolean> {
    return this.getActiveService().triggerBuzzerTest(soundId, durationMs);
  }
}

export const deviceService = new DeviceManager();
