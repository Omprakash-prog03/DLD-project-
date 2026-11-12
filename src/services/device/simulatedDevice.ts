import { Alarm, ClockTime, DeviceStatus, DiagnosticsData, IDeviceService, SoundType } from '../../types';

const STORAGE_KEY = 'dld_smart_alarm_simulated_alarms';
const TIME_OFFSET_KEY = 'dld_smart_alarm_simulated_offset';

const DEFAULT_ALARMS: Alarm[] = [
  {
    id: 'alarm-01',
    title: 'Morning Routine',
    description: 'Wake up, hydrate, and stretch',
    hour: 7,
    minute: 0,
    second: 0,
    enabled: true,
    repeatType: 'weekdays',
    repeatDays: [1, 2, 3, 4, 5],
    date: null,
    soundId: 'buzzer-standard',
    snoozeDuration: 10,
    wakeUpMission: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastTriggeredAt: null,
    syncStatus: 'synced',
  },
  {
    id: 'alarm-02',
    title: 'Focus Block',
    description: 'Hardware lab & circuit testing',
    hour: 9,
    minute: 50,
    second: 0,
    enabled: true,
    repeatType: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    date: null,
    soundId: 'buzzer-pulsed',
    snoozeDuration: 5,
    wakeUpMission: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    lastTriggeredAt: null,
    syncStatus: 'synced',
  },
  {
    id: 'alarm-03',
    title: 'Evening Review',
    description: 'Log hardware sensor data and calibrate RTC',
    hour: 22,
    minute: 30,
    second: 0,
    enabled: false,
    repeatType: 'custom',
    repeatDays: [1, 3, 5],
    date: null,
    soundId: 'buzzer-gentle',
    snoozeDuration: 15,
    wakeUpMission: false,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    lastTriggeredAt: null,
    syncStatus: 'synced',
  },
];

export class SimulatedDevice implements IDeviceService {
  private alarms: Alarm[] = [];
  private timeOffsetSeconds: number = 0; // Offset relative to browser local time
  private rtcSimulatedWorking: boolean = true;
  private simulatedBuzzerActive: boolean = false;
  private bootTime: number = Date.now();
  private simulatedLogs: { timestamp: string; level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'; message: string }[] = [];

  constructor() {
    this.loadFromStorage();
    this.log('INFO', 'Simulated ESP32 firmware v1.2.0 initialized (DS3231 I2C active)');
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') {
      this.alarms = [...DEFAULT_ALARMS];
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.alarms = JSON.parse(stored);
      } else {
        this.alarms = [...DEFAULT_ALARMS];
        this.saveToStorage();
      }

      const offset = localStorage.getItem(TIME_OFFSET_KEY);
      if (offset) {
        this.timeOffsetSeconds = parseInt(offset, 10) || 0;
      }
    } catch {
      this.alarms = [...DEFAULT_ALARMS];
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.alarms));
      localStorage.setItem(TIME_OFFSET_KEY, this.timeOffsetSeconds.toString());
    } catch (e) {
      console.warn('Failed to save simulation state', e);
    }
  }

  private log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string): void {
    this.simulatedLogs.unshift({
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
    });
    if (this.simulatedLogs.length > 50) {
      this.simulatedLogs.pop();
    }
  }

  private async delay(ms: number = 60): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public setRtcWorking(working: boolean): void {
    this.rtcSimulatedWorking = working;
    this.log(working ? 'INFO' : 'WARN', `DS3231 RTC hardware simulation: ${working ? 'ONLINE' : 'OFFLINE'}`);
  }

  public isRtcWorking(): boolean {
    return this.rtcSimulatedWorking;
  }

  public async getStatus(): Promise<DeviceStatus> {
    await this.delay(40);
    const uptimeSec = Math.floor((Date.now() - this.bootTime) / 1000);

    return {
      connected: true,
      deviceName: 'ESP32-WROOM-32 (Simulated)',
      ipAddress: '192.168.4.1 (Simulated AP)',
      clockSource: this.rtcSimulatedWorking ? 'DS3231' : 'ESP32_INTERNAL',
      rtcAvailable: this.rtcSimulatedWorking,
      firmwareVersion: '1.2.0-SIM',
      lastSeen: new Date().toISOString(),
      lastSync: new Date(Date.now() - 15000).toISOString(),
      buzzerActive: this.simulatedBuzzerActive,
      operatingMode: 'simulation',
      connectionState: 'connected',
      wifiMode: 'AP',
      wifiSSID: 'DigitalClock-ESP32',
      rssi: -42,
      uptimeSeconds: uptimeSec,
      freeHeap: 184520,
    };
  }

  public async getTime(): Promise<ClockTime> {
    await this.delay(30);
    const now = new Date(Date.now() + this.timeOffsetSeconds * 1000);

    return {
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      source: this.rtcSimulatedWorking ? 'DS3231' : 'SIMULATED',
      timezone: 'Asia/Kolkata',
    };
  }

  public async setTime(time: Partial<ClockTime>): Promise<{ success: boolean; message: string }> {
    await this.delay(100);
    const now = new Date();

    const targetDate = new Date(
      time.year ?? now.getFullYear(),
      (time.month ?? (now.getMonth() + 1)) - 1,
      time.day ?? now.getDate(),
      time.hour ?? now.getHours(),
      time.minute ?? now.getMinutes(),
      time.second ?? now.getSeconds()
    );

    this.timeOffsetSeconds = Math.round((targetDate.getTime() - now.getTime()) / 1000);
    this.saveToStorage();
    this.log('INFO', `Device time synchronized: ${targetDate.toLocaleString()}`);

    return {
      success: true,
      message: `Time updated to ${targetDate.toLocaleTimeString()} (DS3231 written)`,
    };
  }

  public async getAlarms(): Promise<Alarm[]> {
    await this.delay(50);
    return [...this.alarms];
  }

  public async createAlarm(alarm: Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alarm> {
    await this.delay(80);
    const newAlarm: Alarm = {
      ...alarm,
      id: `alarm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastTriggeredAt: null,
      syncStatus: 'synced',
    };

    this.alarms.push(newAlarm);
    this.saveToStorage();
    this.log('INFO', `Alarm created: "${newAlarm.title}" at ${newAlarm.hour}:${newAlarm.minute}`);
    return newAlarm;
  }

  public async updateAlarm(id: string, updates: Partial<Alarm>): Promise<Alarm> {
    await this.delay(80);
    const idx = this.alarms.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error(`Alarm ${id} not found`);
    }

    const updated: Alarm = {
      ...this.alarms[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };

    this.alarms[idx] = updated;
    this.saveToStorage();
    this.log('INFO', `Alarm updated: "${updated.title}"`);
    return updated;
  }

  public async deleteAlarm(id: string): Promise<boolean> {
    await this.delay(70);
    const beforeLen = this.alarms.length;
    this.alarms = this.alarms.filter((a) => a.id !== id);
    this.saveToStorage();
    const deleted = this.alarms.length < beforeLen;
    if (deleted) {
      this.log('INFO', `Alarm ${id} deleted`);
    }
    return deleted;
  }

  public async toggleAlarm(id: string, enabled?: boolean): Promise<Alarm> {
    await this.delay(60);
    const alarm = this.alarms.find((a) => a.id === id);
    if (!alarm) throw new Error(`Alarm ${id} not found`);

    const newState = enabled !== undefined ? enabled : !alarm.enabled;
    alarm.enabled = newState;
    alarm.updatedAt = new Date().toISOString();
    alarm.syncStatus = 'synced';
    this.saveToStorage();
    this.log('INFO', `Alarm "${alarm.title}" toggled to ${newState ? 'ON' : 'OFF'}`);
    return alarm;
  }

  public async dismissAlarm(id: string): Promise<boolean> {
    await this.delay(50);
    this.simulatedBuzzerActive = false;
    const alarm = this.alarms.find((a) => a.id === id);
    if (alarm) {
      alarm.lastTriggeredAt = new Date().toISOString();
      if (alarm.repeatType === 'once') {
        alarm.enabled = false;
      }
      this.saveToStorage();
      this.log('INFO', `Alarm "${alarm.title}" dismissed`);
    }
    return true;
  }

  public async snoozeAlarm(id: string, minutes: number): Promise<boolean> {
    await this.delay(50);
    this.simulatedBuzzerActive = false;
    this.log('INFO', `Alarm ${id} snoozed for ${minutes} minutes`);
    return true;
  }

  public async getDiagnostics(): Promise<DiagnosticsData> {
    await this.delay(70);
    const status = await this.getStatus();

    return {
      deviceStatus: status,
      i2cAddressesFound: this.rtcSimulatedWorking ? ['0x68 (DS3231 RTC)', '0x57 (AT24C32 EEPROM)'] : [],
      ds3231TempCelsius: this.rtcSimulatedWorking ? 26.75 : undefined,
      ne555FrequencyHz: 1.002, // 1Hz clock pulse
      cd4518CounterSync: true,
      logicGatesStatus: '74HC08, 74HC32, 74HC04 OK — 3.3V/5V Level Shifter Active',
      gpioConfig: {
        buzzerPin: 25,
        i2cSdaPin: 21,
        i2cSclPin: 22,
        counterResetPin: 26,
        ppsInterruptPin: 34,
      },
      recentLogs: this.simulatedLogs,
    };
  }

  public async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = performance.now();
    await this.delay(45);
    const latencyMs = Math.round(performance.now() - start);

    return {
      success: true,
      latencyMs,
      message: 'Simulation link responsive. Microcontroller state nominal.',
    };
  }

  public async triggerBuzzerTest(soundId: SoundType, durationMs: number): Promise<boolean> {
    this.simulatedBuzzerActive = true;
    this.log('INFO', `Buzzer test triggered: sound=${soundId}, duration=${durationMs}ms`);
    setTimeout(() => {
      this.simulatedBuzzerActive = false;
    }, durationMs);
    return true;
  }
}
