// Data models and types for the Digital Clock & Smart Alarm System

export type RepeatType = 'once' | 'daily' | 'weekdays' | 'weekends' | 'custom';

export type TimeFormat = '12h' | '24h';

export type ClockSource = 'DS3231' | 'ESP32_INTERNAL' | 'SIMULATED' | 'BROWSER';

export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'sync_required' | 'error';

export type OperatingMode = 'simulation' | 'hardware';

export type SoundType = 'buzzer-standard' | 'buzzer-pulsed' | 'buzzer-multitone' | 'buzzer-fast' | 'buzzer-gentle';

export interface Alarm {
  id: string;
  title: string;
  description?: string;
  hour: number;        // 0-23
  minute: number;      // 0-59
  second?: number;     // 0-59
  enabled: boolean;
  repeatType: RepeatType;
  repeatDays: number[]; // 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat, 0 = Sun
  date: string | null;  // YYYY-MM-DD for one-time alarms
  soundId: SoundType;
  snoozeDuration: number; // minutes: 0 (off), 5, 10, 15, 30
  wakeUpMission: boolean; // "Clean Entire Field" dot game
  createdAt: string;    // ISO string
  updatedAt: string;    // ISO string
  lastTriggeredAt: string | null;
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export interface ClockTime {
  hour: number;
  minute: number;
  second: number;
  day: number;
  month: number;
  year: number;
  source: ClockSource;
  timezone: string;
}

export interface DeviceStatus {
  connected: boolean;
  deviceName: string;
  ipAddress: string;
  clockSource: ClockSource;
  rtcAvailable: boolean;
  firmwareVersion: string;
  lastSeen: string | null;
  lastSync: string | null;
  buzzerActive: boolean;
  operatingMode: OperatingMode;
  connectionState: ConnectionState;
  wifiMode?: 'AP' | 'STA';
  wifiSSID?: string;
  rssi?: number;
  uptimeSeconds?: number;
  freeHeap?: number;
  errorMessage?: string;
}

export interface DiagnosticsData {
  deviceStatus: DeviceStatus;
  i2cAddressesFound: string[];
  ds3231TempCelsius?: number;
  ne555FrequencyHz?: number;
  cd4518CounterSync: boolean;
  logicGatesStatus: string;
  gpioConfig: {
    buzzerPin: number;
    i2cSdaPin: number;
    i2cSclPin: number;
    counterResetPin: number;
    ppsInterruptPin: number;
  };
  recentLogs: {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    message: string;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  timestamp?: string;
}

export interface IDeviceService {
  getStatus(): Promise<DeviceStatus>;
  getTime(): Promise<ClockTime>;
  setTime(time: Partial<ClockTime>): Promise<{ success: boolean; message: string }>;
  getAlarms(): Promise<Alarm[]>;
  createAlarm(alarm: Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alarm>;
  updateAlarm(id: string, alarm: Partial<Alarm>): Promise<Alarm>;
  deleteAlarm(id: string): Promise<boolean>;
  toggleAlarm(id: string, enabled?: boolean): Promise<Alarm>;
  dismissAlarm(id: string): Promise<boolean>;
  snoozeAlarm(id: string, minutes: number): Promise<boolean>;
  getDiagnostics(): Promise<DiagnosticsData>;
  testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }>;
  triggerBuzzerTest(soundId: SoundType, durationMs: number): Promise<boolean>;
}
